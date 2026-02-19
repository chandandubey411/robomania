// // const express = require("express");
// // const router = express.Router();
// // const upload = require("../Middleware/upload");
// // const { analyzeImage } = require("../Controller/visionController");
// // const { auth } = require("../Middleware/auth");

// // router.post("/image", auth, upload.single("image"), analyzeImage);

// // module.exports = router;

// // const express = require("express");
// // const router = express.Router();
// // const upload = require("../Middleware/upload");
// // const { analyzeImage } = require("../Controller/visionController");
// // const { auth } = require("../Middleware/auth");

// // router.post("/image", auth, upload.single("image"), analyzeImage);

// // module.exports = router;

// const express = require("express");
// const router = express.Router();
// const upload = require("../Middleware/upload");
// const { analyzeImage } = require("../Controller/visionController");

// router.post("/analyze", upload.single("image"), analyzeImage);

// module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const { analyzeImage } = require("../Controller/visionController");
const { auth } = require("../Middleware/auth");

router.post("/analyze", auth, upload.single("image"), analyzeImage);

module.exports = router;
