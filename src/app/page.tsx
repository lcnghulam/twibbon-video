import { Icon } from "@iconify/react";
import LogosHeader from "@/components/LogosHeader";
import Canvas from "@/components/Canvas";
// import VideoConverter from "@/components/VideoConverter";
import { Caption } from "@/components/Caption";

export default function Home() {

  return (
    <div className="container p-4 border-2 border-solid">
      <LogosHeader />
      <h1 className="text-2xl tracking-[4] font-bold mb-2">
        🎉 Twibbon PKKMB 2025 😁
      </h1>
      <span className="greeting font-extralight">
        Halo teman-teman! 👋 Selamat datang di Website Twibbon Univ/Poltek! Buat
        Twibbon gampang, tinggal upload foto lalu sesuaikan, dan... jadi deh...
        Yuk Gasss ✌️👇👇👇
      </span>
      <div className="twibbon-section py-4">
        <Canvas />
        <hr className="my-5" />
        <div className="twibbon-ig flex flex-col gap-2">
          <div className="title inline-flex items-center gap-2 mx-auto">
            <Icon icon="akar-icons:instagram-fill" className="w-6 h-6" />
            <h3 className="font-bold">Caption IG</h3>
          </div>
          <span className="description">
            Siap post feed ke IG? 😍 Yuk isi data dibawah untuk caption 👇
          </span>
          <Caption />
        </div>
      </div>
      <div className="footer inline-flex items-center gap-1">
        <span className="font-extralight">Twibbon Maker by ❤️</span>
        <a
          href="https://aga.is-a.dev"
          target="_blank"
          className="font-bold"
        >
          AGA Dev
        </a>
      </div>
    </div>
  );
}
