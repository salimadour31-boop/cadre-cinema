// Cadre Cinéma - Logique principale
// Outil 100% client-side, aucune donnée envoyée

const translations = {
  fr: {
    title: "Cadre Cinéma",
    upload: "Importer une image",
    drop: "Glissez-déposez ou cliquez",
    ratio: "Ratio",
    mode: "Mode",
    letterbox: "Letterbox (barres)",
    crop: "Crop (recadrage)",
    barColor: "Couleur des barres",
    apply: "Appliquer",
    download: "Télécharger PNG",
    footer: "Outil open source gratuit. Aucune donnée n'est envoyée. MIT License.",
    custom: "Personnalisé"
  },
  en: {
    title: "Cinema Frame",
    upload: "Import an image",
    drop: "Drag & drop or click",
    ratio: "Ratio",
    mode: "Mode",
    letterbox: "Letterbox (bars)",
    crop: "Crop",
    barColor: "Bar color",
    apply: "Apply",
    download: "Download PNG",
    footer: "Free open-source tool. No data is sent. MIT License.",
    custom: "Custom"
  },
  tzm: {
    title: "Akadar n usinima",
    upload: "Sekcem tugna",
    drop: "Sers-d neɣ tekki",
    ratio: "Tasensart",
    mode: "Askar",
    letterbox: "Letterbox (ibarar)",
    crop: "Crop (asemz)",
    barColor: "Init n ibarar",
    apply: "Snes",
    download: "Sider PNG",
    footer: "Allal ufrin open source. Ur yettwazen wacemma. MIT License.",
    custom: "Yettusbadu"
  }
};

let currentLang = "fr";
let currentImage = null;

const elements = {
  title: document.getElementById("title"),
  langSelect: document.getElementById("lang-select"),
  imageInput: document.getElementById("image-input"),
  dropZone: document.getElementById("drop-zone"),
  ratioSelect: document.getElementById("ratio-select"),
  customRatio: document.getElementById("custom-ratio"),
  modeSelect: document.getElementById("mode-select"),
  barColor: document.getElementById("bar-color"),
  applyBtn: document.getElementById("apply-btn"),
  downloadBtn: document.getElementById("download-btn"),
  canvas: document.getElementById("canvas"),
  footer: document.getElementById("footer-text"),
  labelUpload: document.getElementById("label-upload"),
  labelRatio: document.getElementById("label-ratio"),
  labelMode: document.getElementById("label-mode"),
  labelBar: document.getElementById("label-bar-color")
};

function updateLanguage(lang) {
  currentLang = lang;
  const t = translations[lang];
  elements.title.textContent = t.title;
  elements.labelUpload.textContent = t.upload;
  elements.dropZone.textContent = t.drop;
  elements.labelRatio.textContent = t.ratio;
  elements.labelMode.textContent = t.mode;
  elements.modeSelect.options[0].textContent = t.letterbox;
  elements.modeSelect.options[1].textContent = t.crop;
  elements.labelBar.textContent = t.barColor;
  elements.applyBtn.textContent = t.apply;
  elements.downloadBtn.textContent = t.download;
  elements.footer.textContent = t.footer;
  elements.ratioSelect.options[5].textContent = t.custom;
  document.documentElement.lang = lang === "tzm" ? "tzm" : lang;
}

elements.langSelect.addEventListener("change", (e) => updateLanguage(e.target.value));

function loadImage(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      elements.downloadBtn.disabled = false;
      applyFrame();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

elements.imageInput.addEventListener("change", (e) => loadImage(e.target.files[0]));

elements.dropZone.addEventListener("click", () => elements.imageInput.click());
elements.dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  elements.dropZone.classList.add("dragover");
});
elements.dropZone.addEventListener("dragleave", () => elements.dropZone.classList.remove("dragover"));
elements.dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  elements.dropZone.classList.remove("dragover");
  loadImage(e.dataTransfer.files[0]);
});

elements.ratioSelect.addEventListener("change", () => {
  elements.customRatio.style.display = elements.ratioSelect.value === "custom" ? "block" : "none";
});

function getTargetRatio() {
  if (elements.ratioSelect.value === "custom") {
    const val = parseFloat(elements.customRatio.value);
    return isNaN(val) || val <= 0 ? 2.39 : val;
  }
  return parseFloat(elements.ratioSelect.value);
}

function applyFrame() {
  if (!currentImage) return;
  const img = currentImage;
  const targetRatio = getTargetRatio();
  const mode = elements.modeSelect.value;
  const barColor = elements.barColor.value;
  const ctx = elements.canvas.getContext("2d");

  const srcW = img.width;
  const srcH = img.height;
  const srcRatio = srcW / srcH;

  let destW, destH, sx, sy, sW, sH, dx, dy;

  if (mode === "letterbox") {
    // Keep full image, add bars
    if (srcRatio > targetRatio) {
      // Wider source: bars top/bottom
      destW = srcW;
      destH = Math.round(srcW / targetRatio);
      dx = 0;
      dy = Math.round((destH - srcH) / 2);
      sx = 0; sy = 0; sW = srcW; sH = srcH;
    } else {
      // Taller source: bars left/right
      destH = srcH;
      destW = Math.round(srcH * targetRatio);
      dy = 0;
      dx = Math.round((destW - srcW) / 2);
      sx = 0; sy = 0; sW = srcW; sH = srcH;
    }
  } else {
    // Crop to target ratio
    destW = srcW;
    destH = srcH;
    if (srcRatio > targetRatio) {
      // Crop sides
      sW = Math.round(srcH * targetRatio);
      sH = srcH;
      sx = Math.round((srcW - sW) / 2);
      sy = 0;
    } else {
      // Crop top/bottom
      sW = srcW;
      sH = Math.round(srcW / targetRatio);
      sx = 0;
      sy = Math.round((srcH - sH) / 2);
    }
    dx = 0; dy = 0;
  }

  elements.canvas.width = mode === "letterbox" ? destW : sW;
  elements.canvas.height = mode === "letterbox" ? destH : sH;

  // Fill bars if letterbox
  if (mode === "letterbox") {
    ctx.fillStyle = barColor;
    ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
  }

  ctx.drawImage(img, sx, sy, sW, sH, dx, dy, sW, sH);
}

elements.applyBtn.addEventListener("click", applyFrame);

elements.downloadBtn.addEventListener("click", () => {
  if (!currentImage) return;
  const link = document.createElement("a");
  link.download = "cadre-cinema.png";
  link.href = elements.canvas.toDataURL("image/png");
  link.click();
});

// Init
updateLanguage("fr");
