import React, { useEffect } from "react";
import { FaRoad, FaTrash, FaLeaf, FaPlug } from "react-icons/fa";
import AOS from "aos"
import "aos/dist/aos.css";

const categories = [
  {
    title: "Road Infrastructure",
    description:
      "Report potholes, damaged roads, broken sidewalks, and street maintenance issues.",
    icon: <FaRoad className="w-5 h-5 text-gray-700" />,
    reports: "1,247 reports",
    image:
      "https://imgs.search.brave.com/tccdVfm6BobDBqCqhjQElGaJc4nS5DPHC8meV3gbzQM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTM2/MjgzNzI1L3Bob3Rv/L3JvYWQtZGFtYWdl/ZC1ieS1lYXJ0aHF1/YWtlLmpwZz9zPTYx/Mng2MTImdz0wJms9/MjAmYz1jM0NfZVVi/d2tsSzdZcWRCRTZK/WDJnaUtmRUtZT0d2/blV3NTdaVHMxVjFJ/PQ", 
  },
  {
    title: "Waste Management",
    description:
      "Report illegal dumping, overflowing bins, litter, and garbage collection issues.",
    icon: <FaTrash className="w-5 h-5 text-gray-700" />,
    reports: "892 reports",
    image:
      "https://imgs.search.brave.com/eGDDMSxWeCvtRXswqi-opt4IK7kvecrb0GvS1fYwv74/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMjIy/MzYxMDg4Mi9waG90/by9pbnNwZWN0b3Jz/LWF0LXdhc3RlLW1h/bmFnZW1lbnQtZmFj/aWxpdHkuanBnP3M9/NjEyeDYxMiZ3PTAm/az0yMCZjPS1TbVJT/Z05PeUg3XzA0ejZk/NF9qb3JBS2MweWxr/RnFjbFhMUktaOFF3/R1U9",
  },
  {
    title: "Environmental Issues",
    description:
      "Report damaged trees, fallen branches, landscaping problems, and green space issues.",
    icon: <FaLeaf className="w-5 h-5 text-gray-700" />,
    reports: "534 reports",
    image:
      "https://imgs.search.brave.com/PtSPey7opje9ctrPkq65Y3k1MJR9bryiWtdsNjgiOOU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/cHJvZC53ZWJzaXRl/LWZpbGVzLmNvbS82/MmU5NmM2NWViZjI0/MGRiNzJiOThmMzYv/NjMzYjNmNWExMTQz/MzkzOTNhMGYxOTJm/X3Ntb2tlc3RhY2tz/LXBvbGx1dGlvbi0x/MDI0eDY4My5qcGVn", 
  },
  {
    title: "Utilities & Infrastructure",
    description:
      "Report water leaks, gas issues, electrical problems, and utility infrastructure concerns.",
    icon: <FaPlug className="w-5 h-5 text-gray-700" />,
    reports: "678 reports",
    image:
      "https://imgs.search.brave.com/Rm7s5tuBdKF6AHj3xfSZYDbkr0UF1U30wVygupredI0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi91cmJh/bi1pbmZyYXN0cnVj/dHVyZS1oZWF2eS1p/bmR1c3RyaWFsLWhp/Z2h3YXktcHJvamVj/dC1jb25zdHJ1Y3Rp/b24tc2l0ZS02MzU4/MjIyOS5qcGc", 
  },
];

const ReportCategories = () => {

    useEffect(()=>{
        AOS.init({
          duration:1500,
          once:true,
        })
      },[])
  return (
    <section 
      className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center mb-14 px-6">
        <h2 className="text-4xl font-extrabold text-gray-900">
          What Can You Report?
        </h2>
        <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
          Our platform covers a wide range of civic issues to help keep your
          community safe and well-maintained.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-6 md:px-12 lg:px-20">
        {categories.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            data-aos="zoom-in"
          >
            <div className="relative">
              <img
                src={item.image}
                alt={item.title}
                className="h-48 w-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-white rounded-lg p-2 shadow-sm">
                {item.icon}
              </div>
              <p className="absolute bottom-3 left-3 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm">
                {item.reports}
              </p>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReportCategories;
