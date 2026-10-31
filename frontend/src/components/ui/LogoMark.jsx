import { FileText } from "lucide-react";

// InvoSutra logo mark — the original document icon on a gradient badge.
const LogoMark = ({ size = 40, className = "" }) => {
  const icon = Math.round(size * 0.55);
  return (
    <div
      className={`bg-gradient-to-br from-blue-950 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <FileText
        className="text-white"
        style={{ width: icon, height: icon }}
      />
    </div>
  );
};

export default LogoMark;
