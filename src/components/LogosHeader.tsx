"use client";

import Image from "next/image";

const logos = [
  {
    name: "GERMAS",
    image: "LOGO GERMAS png-1 (2).png",
  },
  {
    name: "BLU SPEEDCIRCLE",
    image: "LOGO BLU_SPEEDCIRCLE.png",
  },
  // {
  //   name: "KEMENKES POLTEKKES BARU",
  //   image: "LOGO KEMENKES POLTEKKES BARU-1.png",
  // },
  // {
  //   name: "BEM HD",
  //   image: "LOGO BEM HD.png",
  // },
  // {
  //   name: "BEM 23",
  //   image: "LOGO BEM 23.png",
  // },
  // {
  //   name: "PKKMB 2024",
  //   image: "LOGO PKKMB 2024.png",
  // },
];

export default function LogosHeader() {
  return (
    <div className="overflow-x-auto whitespace-nowrap py-2 px-1">
      <div className="inline-flex gap-4 items-center">
        {logos.map((logo, index) => (
          <div
            key={index}
            className="relative w-[clamp(24px,5vw,50px)] aspect-square"
          >
            <Image
              src={`/logos/${logo.image}`}
              alt={logo.name}
              fill
              className="object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
