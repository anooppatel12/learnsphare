// ✅ Import Firebase Modules (Modular Syntax)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, get, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA6bRiLhghmZFZ801TGHb_0vSjJckPSezw",
  authDomain: "learnsphare.firebaseapp.com",
  databaseURL: "https://learnsphare-default-rtdb.firebaseio.com",
  projectId: "learnsphare",
  storageBucket: "learnsphare.appspot.com",
  messagingSenderId: "68248438363",
  appId: "1:68248438363:web:a9826cefafafc8a66ee17e",
  measurementId: "G-6V507M529E"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ✅ Cloudinary Config
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dh00ohm41/video/upload';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

// ✅ Global Variable
let selectedClass = "";

// ✅ Open Modal
window.openUploadModal = function(cls) {
  selectedClass = cls;
  document.getElementById("classTitle").innerText = `Upload Video for ${cls}`;
  document.getElementById("uploadModal").style.display = "block";
  fetchVideos(); // ✅ Refresh video list
}

// ✅ Close Modal
window.closeUploadModal = function() {
  document.getElementById("uploadModal").style.display = "none";
  selectedClass = "";
}

// ✅ Upload Video to Cloudinary
async function uploadVideo() {
  const title = document.getElementById("videoTitle").value.trim();
  const description = document.getElementById("videoDescription").value.trim();
  const file = document.getElementById("videoFile").files[0];

  if (!title || !description || !file) {
    alert("❌ Please fill all fields and select a video!");
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    // ✅ Upload to Cloudinary
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error("Failed to upload video to Cloudinary");

    const data = await response.json();
    const videoURL = data.secure_url;

    // ✅ Save to Firebase
    const videoRef = push(ref(database, `videos/${selectedClass}`));
    await set(videoRef, {
      title,
      description,
      url: videoURL,
      uploadedAt: new Date().toISOString()
    });

    alert("✅ Video uploaded successfully!");
    fetchVideos();
    closeUploadModal();

  } catch (error) {
    console.error("❌ Upload Error:", error.message);
    alert(`❌ Upload Error: ${error.message}`);
  }
}

// ✅ Fetch Videos from Firebase
async function fetchVideos() {
  if (!selectedClass) return;

  const videoContainer = document.getElementById("videoContainer");
  videoContainer.innerHTML = "";

  try {
    const snapshot = await get(ref(database, `videos/${selectedClass}`));
    if (snapshot.exists()) {
      const videos = snapshot.val();
      Object.keys(videos).forEach((key) => {
        const video = videos[key];
        videoContainer.innerHTML += `
          <div class="video-card">
            <h3>${video.title}</h3>
            <p>${video.description}</p>
            <video controls width="300">
              <source src="${video.url}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
            <button onclick="deleteVideo('${key}', '${video.url}')">❌ Delete</button>
          </div>
        `;
      });
    } else {
      videoContainer.innerHTML = "<p>No videos available for this class.</p>";
    }
  } catch (error) {
    console.error("❌ Error fetching videos:", error.message);
  }
}

// ✅ Delete Video from Firebase + Cloudinary
window.deleteVideo = async function(videoId, videoURL) {
  if (confirm("Are you sure you want to delete this video?")) {
    try {
      // ✅ Extract public ID from Cloudinary URL
      const publicId = videoURL.split('/').pop().split('.')[0];

      // ✅ Delete from Cloudinary
      const deleteUrl = `https://api.cloudinary.com/v1_1/dh00ohm41/delete_by_token`;

      const response = await fetch(deleteUrl, {
        method: 'POST',
        body: JSON.stringify({ token: publicId }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) console.warn("⚠️ Failed to delete video from Cloudinary");

      // ✅ Delete from Firebase
      const videoRef = ref(database, `videos/${selectedClass}/${videoId}`);
      await remove(videoRef);
      alert("✅ Video deleted successfully!");
      fetchVideos();

    } catch (error) {
      console.error("❌ Error deleting video:", error.message);
    }
  }
}

// ✅ Bind Functions After DOM Load
document.addEventListener("DOMContentLoaded", () => {
  const uploadBtn = document.getElementById("uploadBtn");
  
  if (uploadBtn) {
    uploadBtn.addEventListener("click", uploadVideo);
  } else {
    console.error("❌ Error: uploadBtn not found in DOM!");
  }
});
