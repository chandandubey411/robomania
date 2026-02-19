import React, { useEffect } from "react";
import { Camera, MapPin, Send, CheckCircle } from "lucide-react";
import AOS from "aos"
import "aos/dist/aos.css";


const steps = [
  {
    id: 1,
    icon: <Camera className="w-8 h-8 text-white" />,
    color: "bg-blue-500",
    title: "Capture the Issue",
    description:
      "Take a clear photo of the infrastructure problem using your mobile device or camera.",
  },
  {
    id: 2,
    icon: <MapPin className="w-8 h-8 text-white" />,
    color: "bg-green-500",
    title: "Add Location Details",
    description:
      "GPS automatically captures the exact location, or manually adjust for precision.",
  },
  {
    id: 3,
    icon: <Send className="w-8 h-8 text-white" />,
    color: "bg-purple-500",
    title: "Submit Your Report",
    description:
      "Add a brief description and submit your report to the appropriate authorities.",
  },
  {
    id: 4,
    icon: <CheckCircle className="w-8 h-8 text-white" />,
    color: "bg-orange-500",
    title: "Track Progress",
    description:
      "Monitor the status of your report and receive updates when action is taken.",
  },
];


const HowItWorks = () => {

  useEffect(()=>{
    AOS.init({
      duration:1500,
      once:true,
    })
  },[])

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-gray-900">How It Works</h2>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
          Reporting civic issues is simple and straightforward. Follow these four
          easy steps to make a difference.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 px-6 md:px-16 lg:px-28">
        {steps.map((step) => (
          <div
            key={step.id}
            className="relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-8 flex-1 text-center"
            data-aos="fade-up-left"
            // data-aos-delay={index*200}
          >
        
            <div
              className={`mx-auto ${step.color} w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg`}
            >
              {step.icon}
            </div>

           
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-black text-white text-sm flex items-center justify-center font-semibold">
              {step.id}
            </div>

         
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {step.title}
            </h3>

            
            <p className="text-gray-600 text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
