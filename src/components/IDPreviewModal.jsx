import React from "react";

const IDPreviewModal = ({ isOpen, onClose, imageSrc, visitorName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 font-bold text-lg"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4 text-center">{visitorName || "Visitor ID"}</h2>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="ID Preview"
            className="w-full h-auto object-contain"
          />
        ) : (
          <p className="text-center text-gray-500">No ID available</p>
        )}
      </div>
    </div>
  );
};

export default IDPreviewModal;
