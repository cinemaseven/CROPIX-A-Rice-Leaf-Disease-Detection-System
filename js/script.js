document.addEventListener("DOMContentLoaded", async () => {

    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("leafFileInput");
    const customBtn = document.getElementById("customUploadBtn");
    const resultsSection = document.getElementById("resultsSection");

    const previewImage = document.getElementById("previewImage");
    const confidenceValue = document.getElementById("confidenceValue");
    const confidenceText = document.getElementById("confidenceText");
    const diseaseName = document.getElementById("diseaseName");
    const diseaseDescription = document.getElementById("diseaseDescription");
    const recommendationList = document.getElementById("recommendationList");
    const gaugeContainer = document.querySelector('.confidence-overlay');

    const CLASS_MAP = {
        0: { name: "bacterial_leaf_blight", desc: "Disease affecting rice leaves", rec: ["Remove infected leaves"] },
        1: { name: "brown_spot", desc: "Brown lesions on leaves", rec: ["Use fungicide"] },
        2: { name: "healthy_rice_plant", desc: "Plant is healthy", rec: ["Continue normal care"] },
        3: { name: "rice_blast", desc: "Severe fungal infection", rec: ["Apply treatment early"] },
        4: { name: "sheath_blight", desc: "Sheath infection", rec: ["Improve field drainage"] },
        5: { name: "tungro_virus", desc: "Viral disease", rec: ["Remove infected plants"] }
    };

    let model = null;

    async function loadModel() {
        try {
            console.log("Loading model...");

            if (!window.tf) {
                throw new Error("TensorFlow.js not found. Check CDN script.");
            }

            // IMPORTANT: use absolute path to avoid 404 confusion
            model = await tf.loadLayersModel('/model_web/model.json');

            console.log("Model loaded successfully");
        } catch (err) {
            console.error("MODEL LOAD FAILED:", err);
            alert("Model failed to load. Check model_web folder and model.json path.");
        }
    }

    await loadModel();

    async function processImage(file) {

        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file.");
            return;
        }

        previewImage.src = URL.createObjectURL(file);
        resultsSection.style.display = "block";

        diseaseName.textContent = "Analyzing...";
        diseaseDescription.textContent = "Processing image...";

        previewImage.onload = async () => {

            if (!model) {
                alert("Model not loaded.");
                return;
            }

            const tensor = tf.browser.fromPixels(previewImage)
                .resizeNearestNeighbor([224, 224])
                .toFloat()
                .div(255.0)
                .expandDims();

            const prediction = await model.predict(tensor).data();

            const maxIndex = prediction.indexOf(Math.max(...prediction));
            const confidence = (prediction[maxIndex] * 100).toFixed(1);

            updateUI(maxIndex, confidence);
        };
    }

    function updateUI(index, score) {

        const data = CLASS_MAP[index] || {
            name: "Unknown",
            desc: "No data available",
            rec: []
        };

        confidenceValue.textContent = score + "%";
        confidenceText.textContent = score + "%";

        diseaseName.textContent = data.name;
        diseaseDescription.textContent = data.desc;

        recommendationList.innerHTML = data.rec.map(r => `<li>${r}</li>`).join("");

        gaugeContainer.style.setProperty('--fill-deg', (score / 100) * 180 + 'deg');
    }

    // === ABOUT CARD TOGGLE FUNCTIONALITY ===
    const toggleAboutBtn = document.getElementById("toggleAboutBtn");
    const extendedAboutText = document.getElementById("extendedAboutText");

    if (toggleAboutBtn && extendedAboutText) {
        toggleAboutBtn.addEventListener("click", () => {
            const isHidden = extendedAboutText.style.display === "none";
            
            const textSpan = toggleAboutBtn.querySelector(".btn-text");
            const iconNode = toggleAboutBtn.querySelector(".material-icons");

            if (isHidden) {
                extendedAboutText.style.display = "flex";
                if (textSpan) textSpan.textContent = "Show less";
                if (iconNode) iconNode.textContent = "arrow_circle_up";
            } else {
                extendedAboutText.style.display = "none";
                if (textSpan) textSpan.textContent = "Show more";
                if (iconNode) iconNode.textContent = "arrow_circle_down";
            }
        });
    }

    // === PHOTO UPLOAD HANDLERS ===
    if (customBtn) {
        customBtn.addEventListener("click", () => fileInput.click());
    }

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            processImage(e.target.files[0]);
        }
    });

    dropZone.addEventListener("dragover", (e) => e.preventDefault());

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
            processImage(e.dataTransfer.files[0]);
        }
    });

});