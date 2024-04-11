const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');



const fs = require('fs');
const { recognize } = require('node-tesseract-ocr');

const multer = require('multer');
const path = require('path');
const app = express();
app.use(bodyParser.json());

const user = require('./routes/user.js')
app.use(cors());
const sequelize = require('./utils/database');

require('dotenv').config();
app.use(express.static(path.join(__dirname + '/uploads')));



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );



    },
});

const upload = multer({ storage: storage })




app.post('/extracttextfromimage', upload.single('file'), async (req, res) => {
    console.log(req.file.path);



    try {


        const config = {
            lang: 'eng',
            oem: 1,
            psm: 3,
            binary: '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"',
        };

        const text = await recognize(req.file.path, config);
        console.log("Result:", text);
        // res.send(text);
        let indexHtml = fs.readFileSync(path.join(__dirname, './views/index.html'), 'utf8');


        const imageData = fs.readFileSync(req.file.path);
        const encodedImage = Buffer.from(imageData).toString('base64');
        const imageSrc = `data:image/${path.extname(req.file.path).substring(1)};base64,${encodedImage}`;



        indexHtml = indexHtml.replace('</body>', `
       <script>
           document.getElementById('textarea').value = ${JSON.stringify(text)};
           document.getElementById('imagePreview').src = '${imageSrc}';
           document.getElementById('imagePreview').style.display = 'block';
       </script>
   </body>`);



        res.send(indexHtml);
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error processing image');
    }
})


app.use(user);

app.use((req, res, next) => {

    const filePath = req.url.split('?')[0];
    const fullPath = path.join(__dirname, 'views', filePath);

    if (fs.existsSync(fullPath)) {
        res.sendFile(fullPath, (err) => {
            if (err) {
                console.error(`Error sending file: ${fullPath}`);
                next(err);
            }
        });
    } else {
        next();
    }
})


sequelize.sync()
    .then(() => {
        app.listen(3000, () => {
            console.log('server running on port 6900')
        });
    })
    .catch((err) => {
        console.log('error while connecting database:', err);
    })