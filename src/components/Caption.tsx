"use client";

import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";

export function Caption() {
  const [nama, setNama] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [prodi, setProdi] = useState("");
  const [caption, setCaption] = useState("");
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const isValid =
    nama.trim() !== "" || jurusan.trim() !== "" || prodi.trim() !== "";

  useEffect(() => {
    const fallbackNama = nama.trim() === `` ? "{𝙣𝙖𝙢𝙖}" : `"${nama}"`;
    const fallbackJurusan = jurusan.trim() === `` ? "{𝙟𝙪𝙧𝙪𝙨𝙖𝙣}" : jurusan;
    const fallbackProdi = prodi.trim() === `` ? "{𝙥𝙧𝙤𝙙𝙞}" : prodi;

    const newCaption = `✨ 𝐂𝐀𝐏𝐓𝐈𝐎𝐍 𝐓𝐖𝐈𝐁𝐁𝐎𝐍 𝐏𝐊𝐊𝐌𝐁 𝟐𝟎𝟐5 🦚

Haloo Maba 🙌🏼

Saya ${fallbackNama} dari Jurusan ${fallbackJurusan} Prodi ${fallbackProdi} bangga menjadi bagian dari keluarga besar Universitas/Politeknik Nusantara dan siap menyukseskan Pengenalan Kehidupan Kampus Mahasiswa Baru (PKKMB) 2025

Satu Tuju, Satu Jiwa Wujudkan Univ/Poltek Mendunia

"𝑷𝒆𝒏𝒅𝒊𝒅𝒊𝒌𝒂𝒏 𝒂𝒅𝒂𝒍𝒂𝒉 𝒂𝒘𝒂𝒍 𝒅𝒂𝒓𝒊 𝒑𝒆𝒓𝒖𝒃𝒂𝒉𝒂𝒏, 𝒕𝒂𝒏𝒑𝒂 𝒑𝒆𝒏𝒅𝒊𝒅𝒊𝒌𝒂𝒏 𝒕𝒊𝒅𝒂𝒌 𝒂𝒅𝒂 𝒑𝒆𝒓𝒂𝒅𝒂𝒃𝒂𝒏." - 𝗡𝗮𝗷𝘄𝗮 𝗦𝗵𝗶𝗵𝗮𝗯

@pkkmbunivpoltek @pkkmbunivpoltek @pkkmbunivpoltek

#PKKMB2025
#PKKMBUNIVPOLTEK2025
#MABAUNIVPOLTEK2025
#BEMUNIVPOLTEK`;

    setCaption(newCaption);
    setVisible(isValid);
  }, [nama, jurusan, prodi]);

  const handleCopy = async () => {
    if (copied) return;

    try {
      const textarea = document.createElement("textarea");
      textarea.value = caption;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);

      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error("Fallback copy gagal");
      }
    } catch (err) {
      console.error("Gagal menyalin caption:", err);
      alert(
        "Browser kamu tidak mendukung fitur salin otomatis. Silakan salin manual."
      );
    }
  };

  const handleReset = () => {
    setNama("");
    setJurusan("");
    setProdi("");
  };

  return (
    <div id="captionIG" className="flex flex-col pt-4">
      <div className="flex flex-col gap-1 mb-2">
        <label htmlFor="nama">Nama Lengkap</label>
        <input
          type="text"
          name="nama"
          id="nama"
          placeholder="Muhammad Stevanus Akbar"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1 mb-2">
        <label htmlFor="jurusan">Jurusan</label>
        <input
          type="text"
          name="jurusan"
          id="jurusan"
          placeholder="Kebidanan"
          value={jurusan}
          onChange={(e) => setJurusan(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1 mb-2">
        <label htmlFor="prodi">Prodi</label>
        <input
          type="text"
          name="prodi"
          id="prodi"
          placeholder="Asuransi Kesehatan"
          value={prodi}
          onChange={(e) => setProdi(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1 mb-2">
        <label htmlFor="caption">Format Caption</label>
        <textarea
          name="caption"
          id="caption"
          rows={15}
          readOnly
          value={caption}
        />
      </div>
      <div className="caption-buttons inline-flex flex-wrap justify-center items-center gap-2">
        <button
          className={copied ? "btn-copied" : "btn-copy"}
          onClick={handleCopy}
          disabled={copied}
        >
          <Icon icon={copied ? "mingcute:check-line" : "ic:twotone-copy-all"} />
          <span className="ms-1">{copied ? "Copied!" : "Copy"}</span>
        </button>
        <button
          className={`btn-reset ${!visible ? "!hidden" : ""}`}
          onClick={handleReset}
        >
          <Icon icon="fluent:arrow-reset-48-filled" />
          <span className="ms-1">Reset</span>
        </button>
      </div>
    </div>
  );
}
