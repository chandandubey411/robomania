import { Github, Linkedin, X } from "lucide-react";
import logo from "../images/logo.png";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 border-t mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="CivicTracks Logo" className="w-10 h-10" />
          <span className="text-lg font-bold text-gray-900">CivicTracks</span>
        </div>

        {/* Tagline */}
        <p className="text-sm text-gray-600 text-center max-w-md">
          Building better communities through technology and civic action.
        </p>

        {/* Social */}
        <div className="flex gap-4">
          {[X, Github, Linkedin].map((Icon, i) => (
            <div
              key={i}
              className="p-2 rounded-full bg-white shadow hover:shadow-lg transition cursor-pointer hover:scale-105"
            >
              <Icon className="w-5 h-5 text-gray-700 hover:text-blue-600 transition" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom line */}
      <div className="border-t py-4 text-center text-xs text-gray-500">
        © All rights reserved.
      </div>
    </footer>
  );
}
