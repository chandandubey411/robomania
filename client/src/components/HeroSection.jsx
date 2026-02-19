import React from "react";
import { Camera, ArrowRight, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Slider1 from "./slider1";

const Hero = () => {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 px-6 md:px-12 lg:px-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
       
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Report Issues,
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-green-500 text-transparent bg-clip-text px-1">
                Transform
              </span>
              <br />
              Your Community
            </h1>
            <p className="text-lg text-gray-600 max-w-md">
              Help build safer, cleaner neighborhoods by reporting infrastructure issues.
              From potholes to broken streetlights, your voice matters.
            </p>
          </div>

      
          <div className="flex flex-col sm:flex-row gap-4">
          
            <Link
              to="/report"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-3 rounded-md shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium"
            >
              <Camera className="w-5 h-5" />
              Report an Issue
              <ArrowRight className="w-5 h-5" />
            </Link>

            <button
                  onClick={() => {
                    const section = document.getElementById("report-categories");
                    section?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center justify-center gap-2 border border-gray-300 text-gray-800 px-6 py-3 rounded-md shadow-sm hover:bg-gray-100 transition-all duration-300 font-medium"
                >
                  <MapPin className="w-5 h-5 text-green-600" />
                      View Reports
           </button>

          </div>

        
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-sky-500">2,847</div>
              <div className="text-sm text-gray-500">Issues Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-sky-500">15,239</div>
              <div className="text-sm text-gray-500">Active Citizens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-sky-500">48h</div>
              <div className="text-sm text-gray-500">Avg Response</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative rounded-2xl  pl-10">
            <Slider1/>

           
            {/* <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md border border-white/30 rounded-lg px-4 py-2 flex items-center gap-2 shadow-md">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm font-medium text-gray-800">
                Issue Reported
              </span>
            </div> */}

           
            {/* <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md border border-white/30 rounded-lg px-4 py-2 flex items-center gap-2 shadow-md">
              <Users className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-800">
                Community Active
              </span>
            </div> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
