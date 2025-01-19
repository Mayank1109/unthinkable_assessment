import { useState, useRef, useEffect } from "react";
import { createWorker } from "tesseract.js";
import "./DragDropFiles.css";
import axios from "axios";
import { getDocument } from "pdfjs-dist";
import { GlobalWorkerOptions } from "pdfjs-dist";

const DragDropFiles = () => {
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  // maintaining the states through these
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("select");
  const [textResult, setTextResult] = useState(
    "content will be displayed here"
  );

  // This function will parse the pdf that is uploaded
  const pdfParseHandler = async (src) => {
    const doc = await getDocument(src).promise;
    const numPages = doc.numPages;
    let text = "";
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      content.items.forEach((item) => {
        text += item.str + " ";
      });
    }
    return text;
  };

  // This function extracts text from images, basically OCR
  const OCRHandler = async () => {
    try {
      const worker = await createWorker("eng");

      const { data } = await worker.recognize(URL.createObjectURL(file));
      setTextResult(data.text);
      console.log(data.text);
      await worker.terminate();
    } catch (error) {
      console.error("Error during OCR processing:", error);
    }
  };

  const inputRef = useRef();

  // The following two functions are handling the drag and drop events for file upload
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setFilePreview(URL.createObjectURL(droppedFile));
    }
  };

  // This functions handle the file selection event
  const handleFileSelection = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  // This function oversees the upload event
  const handleUpload = async () => {
    if (file) {
      if (file.type.startsWith("image/")) {
        OCRHandler();
      } else if (file.type === "application/pdf") {
        const text = await pdfParseHandler(URL.createObjectURL(file));
        setTextResult(text);
      }
      setUploadStatus("done");
    }
    if (uploadStatus === "done") {
      setFile(null);
      setFilePreview(null);
      setProgress(0);
      setUploadStatus("select");
      return;
    }
    try {
      setUploadStatus("uploading");
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "http://localhost:7000/dashboard",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );
      setUploadStatus("done");
    } catch (error) {
      console.error(error);
      setUploadStatus("select");
    }
  };

  //If a file is selected by the user , following UI will be displayed
  // This has basically four parts : icon, then file description, a progress bar to display the upload status
  // and finally an icon to cancel the action
  if (file)
    return (
      <>
        <div className="wrapper">
          <div className="file-card">
            <span className="material-symbols-outlined icon">description</span>
            <div className="file-info">
              <div style={{ flex: 1 }}>
                <h6 className="extra">
                  {file.name.length > 20
                    ? `${file.name.slice(0, 23)}...`
                    : file.name}
                </h6>

                <div className="progress-bg">
                  <div className="progress" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            {uploadStatus === "select" ? (
              <button
                className="cancel"
                onClick={() => {
                  setFile(null);
                  setUploadStatus("select");
                  setProgress(0);
                }}
              >
                <span class="material-symbols-outlined close-icon">close</span>
              </button>
            ) : (
              <div className="check-circle">
                {uploadStatus === "uploading" ? (
                  `${progress}%`
                ) : uploadStatus === "done" ? (
                  <span
                    class="material-symbols-outlined"
                    style={{ fontSize: "20px" }}
                  >
                    check
                  </span>
                ) : null}
              </div>
            )}
          </div>
          <button className="upload-btn" onClick={handleUpload}>
            {uploadStatus === "select" || uploadStatus === "uploading"
              ? "Upload"
              : "Done"}
          </button>
        </div>

        {/* This segment displays the file that is going to be uploaded.
 if it is an image the preview would be available,
  but if it's a pdf, then no preview */}

        {filePreview && (
          <div className="group">
            <div className="result">
              {file.type.startsWith("image/") ? (
                <img className="image" src={filePreview} alt="Uploaded file" />
              ) : (
                <p>Preview not available for non-image files.</p>
              )}
            </div>
            <div className="extracted">{textResult}</div>
          </div>
        )}
      </>
    );

  //This UI component is the dropzone which is responsible for uploading, it also contains a button
  // to give user a choice whether to select a file from the system
  // or they can just drag the file and drop it directly in the dropzone to upload it
  return (
    <div className="container">
      <div
        className="dropzone uploads"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <h1>Drag and Drop Files to Upload</h1>
        <h1>Or</h1>
        <input
          type="file"
          onChange={handleFileSelection}
          hidden
          accept="image/png, image/jpeg, application/pdf"
          ref={inputRef}
        />
        <button onClick={() => inputRef.current.click()}>Select Files</button>
      </div>
    </div>
  );
};

export default DragDropFiles;
