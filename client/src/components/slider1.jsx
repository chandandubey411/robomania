import React, { useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';

import './styles.css';

// import required modules
import { EffectCards } from 'swiper/modules';

const Slider1=()=> {
  return (
    <>
      <Swiper
        effect={'cards'}
        grabCursor={true}
        modules={[EffectCards]}
        className="Slider1"
      >
        <SwiperSlide>
            <div className='rounded-md overflow-hidden'>
                <img src='https://cdn.shopify.com/s/files/1/0274/7288/7913/files/MicrosoftTeams-image_32.jpg?v=1705315718'/>
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='rounded-md overflow-hidden'>
                <img src='https://media.istockphoto.com/id/184086176/photo/broken-pole.jpg?s=612x612&w=0&k=20&c=ovVKvjEHEdgmHOzslxP-h_ifF5TpNZ4vsV46cV4wSHU='/>
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='rounded-md overflow-hidden'>
            <img src='https://media.assettype.com/deccanherald%2F2024-10-28%2Fqhwtz86f%2Ffile7xt0qmoha6q6u6v48k2.jpg?w=undefined&auto=format%2Ccompress&fit=max'/>
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='rounded-md overflow-hidden'>
            <img src='https://earth5r.org/wp-content/uploads/2024/03/8-Major-Sources-Of-Air-Pollution-1024x639.webp'/>
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='rounded-md overflow-hidden'>
            <img src='https://d3i6fh83elv35t.cloudfront.net/static/2025/06/2025-06-15T140734Z_768644566_RC223FAF8A5E_RTRMADP_3_INDIA-DISASTER-1024x575.jpg'/>
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='rounded-md overflow-hidden'>
            <img src='https://bloximages.chicago2.vip.townnews.com/thestar.com/content/tncms/assets/v3/editorial/e/cc/ecc0ac27-f27d-5721-b2ce-85c43866817d/666719a3564bd.image.jpg?resize=1200%2C900'/>
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='rounded-md overflow-hidden'>
            <img src='https://electricityforum.com/uploads/articles/what-is-an-electrical-fault_1678852800.webp'/>
            </div>
        </SwiperSlide>
      </Swiper>
    </>
  );
}

export default Slider1;
