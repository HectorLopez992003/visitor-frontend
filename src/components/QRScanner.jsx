import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

const QRScanner = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        scanner.clear();
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div>
      <div id="qr-reader" />
      <button
        onClick={onClose}
        className="mt-3 w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
      >
        Close Scanner
      </button>
    </div>
  );
};

export default QRScanner;
