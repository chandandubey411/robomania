import React, { useEffect } from "react";
import {
  Camera,
  MapPin,
  Users,
  Activity,
  Shield,
  BarChart3,
} from "lucide-react";
import AOS from "aos"
import "aos/dist/aos.css";

const features = [
  {
    icon: <Camera className="w-6 h-6 text-blue-600" />,
    color: "bg-blue-50",
    title: "Photo Documentation",
    description:
      "Capture and upload high-quality images of infrastructure issues with automatic metadata tagging.",
  },
  {
    icon: <MapPin className="w-6 h-6 text-green-600" />,
    color: "bg-green-50",
    title: "GPS Location Tracking",
    description:
      "Precise location capture using GPS coordinates ensures accurate issue positioning and faster response.",
  },
  {
    icon: <Users className="w-6 h-6 text-purple-600" />,
    color: "bg-purple-50",
    title: "Community Engagement",
    description:
      "Connect with neighbors, track issue status, and see the impact of your reports on the community.",
  },
  {
    icon: <Activity className="w-6 h-6 text-orange-600" />,
    color: "bg-orange-50",
    title: "Real-time Updates",
    description:
      "Get instant notifications about your reported issues and track resolution progress in real-time.",
  },
  {
    icon: <Shield className="w-6 h-6 text-red-600" />,
    color: "bg-red-50",
    title: "Admin Dashboard",
    description:
      "Comprehensive tools for managing reports, assigning tasks, and monitoring city-wide issues.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
    color: "bg-indigo-50",
    title: "Analytics & Insights",
    description:
      "Data-driven insights help administrators prioritize resources and track improvement trends.",
  },
];

const FeaturesSection = () => {

  useEffect(()=>{
      AOS.init({
        duration:1500,
        once:true,
      })
    },[])

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center mb-14 px-6">
        <h2 className="text-4xl font-extrabold text-gray-900">
          Powerful Features for Better Communities
        </h2>
        <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
          Everything you need to report, track, and resolve civic issues efficiently and effectively.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6 md:px-12 lg:px-20">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 relative"
            data-aos="fade-down-right"
          >
            <div
              className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}
            >
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
