import React, { useEffect, useMemo, useRef, useState } from "react";

// BluWiki: a single-file, bilingual (EN/VI) personal wiki + number base converters
// - Works fully offline
// - Stores data in localStorage
// - Search + Add/Edit terms (lightweight)
// - Hex/Dec/Bin converter (BigInt-based)
// - Export/Import JSON
// ───────────────────────────────────────────────────────────────
// Quick start (when embedded in a React runtime like this canvas):
// 1) This file exports a default component. No extra deps.
// 2) Data persists in your browser (localStorage). Use Export/Import for backup.
// 3) You can later wrap this as:
//    - Web/PWA (Vite build) or
//    - Desktop app (Tauri/Electron) or
//    - Docker static site (Nginx)

const STORAGE_KEY = "bluwiki.terms.v1";

const seedTerms = [
  {
    id: "ip",
    abbr: "IP",
    en: {
      title: "Internet Protocol",
      def: "Core protocol for routing packets across networks. IP addresses identify hosts; IPv4 uses 32-bit addresses, IPv6 uses 128-bit.",
      example: "An IPv4 address like 192.168.1.10 identifies a device on a network.",
    },
    vi: {
      title: "Giao thức Internet",
      def: "Giao thức lõi dùng để định tuyến gói tin qua các mạng. Địa chỉ IP xác định thiết bị; IPv4 32-bit, IPv6 128-bit.",
      example: "Ví dụ IPv4: 192.168.1.10 xác định 1 máy trong mạng.",
    },
    tags: ["network"],
  },
  {
    id: "tcp",
    abbr: "TCP",
    en: {
      title: "Transmission Control Protocol",
      def: "Reliable, ordered, bytesream transport protocol used by HTTP/HTTPS, SMTP, etc.",
      example: "HTTPS typically runs over TCP port 443.",
    },
    vi: {
      title: "Giao thức TCP",
      def: "Giao thức truyền tải đáng tin cậy, có thứ tự; thường dùng cho HTTP/HTTPS, SMTP...",
      example: "HTTPS thường chạy cổng TCP 443.",
    },
    tags: ["network", "transport"],
  },
  {
    id: "udp",
    abbr: "UDP",
    en: {
      title: "User Datagram Protocol",
      def: "Connectionless transport protocol with low overhead. Good for latency-sensitive apps (games, streaming).",
      example: "DNS commonly uses UDP port 53.",
    },
    vi: {
      title: "Giao thức UDP",
      def: "Giao thức truyền tải không thiết lập kết nối, chi phí thấp; phù hợp ứng dụng cần độ trễ thấp.",
      example: "DNS thường dùng UDP cổng 53.",
    },
    tags: ["network", "transport"],
  },
  {
    id: "dns",
    abbr: "DNS",
    en: {
      title: "Domain Name System",
      def: "Translates human-friendly names to IP addresses using a distributed hierarchy of servers.",
      example: "Resolving example.com → 93.184.216.34",
    },
    vi: {
      title: "Hệ thống tên miền",
      def: "Chuyển đổi tên miền thân thiện thành địa chỉ IP thông qua hệ thống máy chủ phân cấp.",
      example: "Phân giải example.com → 93.184.216.34",
    },
    tags: ["network"],
  },
  {
    id: "http",
    abbr: "HTTP",
    en: {
      title: "Hypertext Transfer Protocol",
      def: "Application-layer protocol for web content transfer. Stateless; often uses port 80.",
      example: "Fetching an HTML page via HTTP.",
    },
    vi: {
      title: "Giao thức HTTP",
      def: "Giao thức tầng ứng dụng để truyền nội dung web. Không trạng thái; thường cổng 80.",
      example: "Tải trang HTML qua HTTP.",
    },
    tags: ["web"],
  },
  {
    id: "https",
    abbr: "HTTPS",
    en: {
      title: "HTTP Secure",
      def: "HTTP over TLS/SSL with encryption and authenticity. Commonly uses port 443.",
      example: "Most modern sites use HTTPS by default.",
    },
    vi: {
      title: "HTTP bảo mật",
      def: "HTTP chạy qua TLS/SSL để mã hóa và xác thực. Thường cổng 443.",
      example: "Hầu hết website hiện đại dùng HTTPS mặc định.",
    },
    tags: ["web", "security"],
  },
  {
    id: "dhcp",
    abbr: "DHCP",
    en: {
      title: "Dynamic Host Configuration Protocol",
      def: "Automatically assigns IP configuration (address, gateway, DNS) to devices on a network.",
      example: "Your router gives your laptop an IP via DHCP.",
    },
    vi: {
      title: "Giao thức DHCP",
      def: "Tự động cấp cấu hình IP (địa chỉ, gateway, DNS) cho thiết bị trong mạng.",
      example: "Router cấp IP cho laptop của bạn qua DHCP.",
    },
    tags: ["network"],
  },
  {
    id: "ftp",
    abbr: "FTP",
    en: {
      title: "File Transfer Protocol",
      def: "Legacy file-transfer protocol. Plain FTP is insecure; prefer SFTP or FTPS.",
      example: "Avoid plain FTP on the public Internet.",
    },
    vi: {
      title: "Giao thức FTP",
      def: "Giao thức truyền tệp cũ; FTP thuần không an toàn, nên dùng SFTP/FTPS.",
      example: "Không nên dùng FTP thường trên Internet công cộng.",
    },
    tags: ["file", "security"],
  },
  {
    id: "sftp",
    abbr: "SFTP",
    en: {
      title: "SSH File Transfer Protocol",
      def: "Secure file-transfer protocol running over SSH.",
      example: "Connect via sftp user@host.",
    },
    vi: {
      title: "Giao thức SFTP",
      def: "Giao thức truyền tệp an toàn chạy trên SSH.",
      example: "Kết nối: sftp user@host.",
    },
    tags: ["file", "security"],
  },
  {
    id: "hex",
    abbr: "HEX",
    en: {
      title: "Hexadecimal",
      def: "Base-16 numbering system (digits 0-9, A-F). Common in memory addresses and color codes.",
      example: "0xFF = 255 (decimal).",
    },
    vi: {
      title: "Hệ thập lục phân",
      def: "Hệ cơ số 16 (0-9, A-F). Phổ biến trong địa chỉ bộ nhớ, mã màu.",
      example: "0xFF = 255 (thập phân).",
    },
    tags: ["math", "number-base"],
  },
  {
    id: "bin",
    abbr: "BIN",
    en: {
      title: "Binary",
      def: "Base-2 numbering system (digits 0,1). Fundamental to digital systems.",
      example: "0b1010 = 10 (decimal).",
    },
    vi: {
      title: "Hệ nhị phân",
      def: "Hệ cơ số 2 (0,1). Nền tảng của máy tính số.",
      example: "0b1010 = 10 (thập phân).",
    },
    tags: ["math", "number-base"],
  },
  {
    id: "dec",
    abbr: "DEC",
    en: {
      title: "Decimal",
      def: "Base-10 numbering system (digits 0-9).",
      example: "255 (decimal) = 0xFF (hex).",
    },
    vi: {
      title: "Hệ thập phân",
      def: "Hệ cơ số 10 (0-9).",
      example: "255 (thập phân) = 0xFF (hex).",
    },
    tags: ["math", "number-base"],
  },
];

function useLocalStorageState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

// Search/normalize helpers
const fold = s => (s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
const occ = (n,h="") => { n=fold(n); h=fold(h); let i=0,c=0; while((i=h.indexOf(n,i))!==-1){c++; i+=n.length;} return c; };
// optional fuzzy (1 edit) for short strings
const editDistLe1 = (a,b) => {
  a=fold(a); b=fold(b);
  if (a===b) return true;
  if (Math.abs(a.length-b.length)>1) return false;
  let i=0,j=0,edits=0;
  while(i<a.length && j<b.length){
    if(a[i]===b[j]){ i++; j++; continue; }
    edits++; if(edits>1) return false;
    if(a.length>b.length) i++; else if(a.length<b.length) j++; else { i++; j++; }
  }
  return edits + (a.length-i) + (b.length-j) <= 1;
};
// ── Number base utils (BigInt) ──────────────────────────────────────────────
const RE = {
  hex: /^[0-9a-fA-F]+$/, // allow uppercase/lowercase
  bin: /^[01]+$/,
  dec: /^[+-]?[0-9]+$/,
};

function toClean(s) {
  return (s || "").trim();
}

function parseBigIntFromBase(str, base) {
  const s = toClean(str);
  if (!s) return null;
  try {
    if (base === 16) return BigInt("0x" + s);
    if (base === 2) return BigInt("0b" + s);
    if (base === 10) return BigInt(s);
    return null;
  } catch {
    return null;
  }
}

function toBaseString(n, base) {
  if (n === null) return "";
  const neg = n < 0n;
  const abs = neg ? -n : n;
  const s = abs.toString(base);
  return neg ? "-" + s : s;
}

// Sync three fields without feedback loops
function useTriBaseSync() {
  const [hex, setHex] = useState("");
  const [dec, setDec] = useState("");
  const [bin, setBin] = useState("");
  const updating = useRef(null); // "hex" | "dec" | "bin" | null

  const updateFrom = (field, val) => {
    updating.current = field;
    if (field === "hex") {
      const ok = !val || RE.hex.test(val);
      setHex(val);
      if (ok) {
        const n = parseBigIntFromBase(val, 16);
        setDec(n !== null ? toBaseString(n, 10) : "");
        setBin(n !== null ? toBaseString(n, 2) : "");
      }
    } else if (field === "dec") {
      const ok = !val || RE.dec.test(val);
      setDec(val);
      if (ok) {
        const n = parseBigIntFromBase(val, 10);
        setHex(n !== null ? toBaseString(n, 16).toUpperCase() : "");
        setBin(n !== null ? toBaseString(n, 2) : "");
      }
    } else if (field === "bin") {
      const ok = !val || RE.bin.test(val);
      setBin(val);
      if (ok) {
        const n = parseBigIntFromBase(val, 2);
        setDec(n !== null ? toBaseString(n, 10) : "");
        setHex(n !== null ? toBaseString(n, 16).toUpperCase() : "");
      }
    }
    updating.current = null;
  };

  return {
    hex,
    dec,
    bin,
    setHex: (v) => updateFrom("hex", v),
    setDec: (v) => updateFrom("dec", v),
    setBin: (v) => updateFrom("bin", v),
  };
}

function Pill({ children }) {
  return (
    <span className="rounded-full border px-2 py-0.5 text-xs text-gray-700 dark:text-gray-200">
      {children}
    </span>
  );
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <div className="rounded-2xl border bg-white/60 backdrop-blur p-4 md:p-5 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-0.5">{subtitle}</p>
          ) : null}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, monospaced, right }) {
  return (
    <label className="block mb-3">
      <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</div>
      <div className="relative">
        <input
          className={classNames(
            "w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring",
            "bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700",
            monospaced && "font-mono"
          )}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {right ? <div className="absolute right-2 top-1/2 -translate-y-1/2">{right}</div> : null}
      </div>
    </label>
  );
}

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text || "");
          setOk(true);
          setTimeout(() => setOk(false), 800);
        } catch {}
      }}
      className="text-xs px-2 py-1 rounded-lg border bg-white hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      title="Copy"
    >
      {ok ? "Copied" : "Copy"}
    </button>
  );
}

function CopyMarkdownBtn({ term }) {
  const generateMarkdown = (t) => {
    let md = `# ${t.abbr}\n\n`;
    if (t.en?.title) md += `**English**: ${t.en.title}\n\n`;
    if (t.vi?.title) md += `**Tiếng Việt**: ${t.vi.title}\n\n`;
    if (t.en?.def) md += `## Definition (EN)\n${t.en.def}\n\n`;
    if (t.en?.example) md += `*Example*: ${t.en.example}\n\n`;
    if (t.vi?.def) md += `## Định nghĩa (VI)\n${t.vi.def}\n\n`;
    if (t.vi?.example) md += `*Ví dụ*: ${t.vi.example}\n\n`;
    if (t.tags?.length) md += `**Tags**: ${t.tags.join(', ')}\n\n`;
    return md;
  };

  return <CopyBtn text={generateMarkdown(term)} />;
}

function Converters() {
  const { hex, dec, bin, setHex, setDec, setBin } = useTriBaseSync();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <SectionCard title="Hex → Dec/Bin" subtitle="Thập lục phân → Thập phân/Nhị phân">
        <Field label="HEX (0-9 A-F)" value={hex} onChange={setHex} placeholder="FF" monospaced right={<CopyBtn text={hex} />} />
        <div className="grid grid-cols-1 gap-3">
          <Field label="DEC" value={dec} onChange={() => {}} placeholder="255" monospaced right={<CopyBtn text={dec} />} />
          <Field label="BIN" value={bin} onChange={() => {}} placeholder="11111111" monospaced right={<CopyBtn text={bin} />} />
        </div>
      </SectionCard>
      <SectionCard title="Dec → Hex/Bin" subtitle="Thập phân → Hex/Nhị phân">
        <Field label="DEC" value={dec} onChange={setDec} placeholder="255" monospaced right={<CopyBtn text={dec} />} />
        <div className="grid grid-cols-1 gap-3">
          <Field label="HEX" value={hex} onChange={() => {}} placeholder="FF" monospaced right={<CopyBtn text={hex} />} />
          <Field label="BIN" value={bin} onChange={() => {}} placeholder="11111111" monospaced right={<CopyBtn text={bin} />} />
        </div>
      </SectionCard>
      <SectionCard title="Bin → Dec/Hex" subtitle="Nhị phân → Thập phân/Hex">
        <Field label="BIN (0/1)" value={bin} onChange={setBin} placeholder="1010" monospaced right={<CopyBtn text={bin} />} />
        <div className="grid grid-cols-1 gap-3">
          <Field label="DEC" value={dec} onChange={() => {}} placeholder="10" monospaced right={<CopyBtn text={dec} />} />
          <Field label="HEX" value={hex} onChange={() => {}} placeholder="A" monospaced right={<CopyBtn text={hex} />} />
        </div>
      </SectionCard>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "px-3 py-2 rounded-lg text-sm border transition-colors duration-200",
        active
          ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
          : "bg-white text-gray-700 dark:bg-zinc-800 dark:text-gray-200 border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700"
      )}
    >
      {children}
    </button>
  );
}

function TermItem({ t, onSelect }) {
  return (
    <button
      onClick={() => onSelect?.(t)}
      className="w-full text-left rounded-xl border p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 border-gray-200 dark:border-zinc-800"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold tracking-wide">{t.abbr}</span>
        <span className="text-xs text-gray-600 dark:text-gray-300">{t.en?.title}</span>
      </div>
      <div className="mt-1 text-sm leading-snug text-gray-600 dark:text-gray-400 line-clamp-2">{t.en?.def}</div>
      <div className="mt-2 flex flex-wrap gap-1">{(t.tags || []).map((x) => <Pill key={x}>{x}</Pill>)}</div>
    </button>
  );
}

function TermDetail({ t, onEdit, onDelete }) {
  if (!t) return null;
  return (
    <div className="rounded-2xl border bg-white/60 dark:bg-zinc-900/60 dark:border-zinc-800 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">
            {t.abbr} <span className="text-sm text-gray-500">/ {t.en?.title}</span>
          </h3>
          <div className="mt-2 grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium">English</h4>
              <p className="text-[15px] md:text-base leading-relaxed text-gray-700 dark:text-gray-200 mt-1">{t.en?.def}</p>
              {t.en?.example ? (
                <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Example:</span> {t.en.example}</p>
              ) : null}
            </div>
            <div>
              <h4 className="text-sm font-medium">Tiếng Việt</h4>
              <p className="text-[15px] md:text-base leading-relaxed text-gray-700 dark:text-gray-200 mt-1">{t.vi?.def}</p>
              {t.vi?.example ? (
                <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Ví dụ:</span> {t.vi.example}</p>
              ) : null}
            </div>
          </div>
          {t.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1">{t.tags.map((x) => <Pill key={x}>{x}</Pill>)}</div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-xs px-3 py-1 rounded-lg border">Edit</button>
          <button onClick={onDelete} className="text-xs px-3 py-1 rounded-lg border text-red-600">Delete</button>
        </div>
      </div>
    </div>
  );
}

function TermEditor({ initial, onSave, onCancel }) {
  const [abbr, setAbbr] = useState(initial?.abbr || "");
  const [enTitle, setEnTitle] = useState(initial?.en?.title || "");
  const [enDef, setEnDef] = useState(initial?.en?.def || "");
  const [enExample, setEnExample] = useState(initial?.en?.example || "");
  const [viTitle, setViTitle] = useState(initial?.vi?.title || "");
  const [viDef, setViDef] = useState(initial?.vi?.def || "");
  const [viExample, setViExample] = useState(initial?.vi?.example || "");
  const [tags, setTags] = useState((initial?.tags || []).join(", "));

  return (
    <div className="rounded-2xl border bg-white/70 dark:bg-zinc-900/70 dark:border-zinc-800 p-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Abbreviation (viết tắt)" value={abbr} onChange={setAbbr} placeholder="IP, TCP..." />
        <Field label="Tags (phân cách bằng dấu phẩy)" value={tags} onChange={setTags} placeholder="network, web" />
        <Field label="EN Title" value={enTitle} onChange={setEnTitle} placeholder="Internet Protocol" />
        <label className="md:col-span-1">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">EN Definition</div>
          <textarea className="w-full rounded-xl border px-3 py-2 min-h-[96px] bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700" value={enDef} onChange={(e)=>setEnDef(e.target.value)} placeholder="Definition in English" />
        </label>
        <Field label="EN Example" value={enExample} onChange={setEnExample} placeholder="Example sentence" />
        <Field label="VI Title" value={viTitle} onChange={setViTitle} placeholder="Giao thức Internet" />
        <label className="md:col-span-1">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">VI Định nghĩa</div>
          <textarea className="w-full rounded-xl border px-3 py-2 min-h-[96px] bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700" value={viDef} onChange={(e)=>setViDef(e.target.value)} placeholder="Định nghĩa tiếng Việt" />
        </label>
        <Field label="VI Ví dụ" value={viExample} onChange={setViExample} placeholder="Câu ví dụ" />
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            const t = {
              id: (initial?.id || abbr || Math.random().toString(36).slice(2)).toLowerCase(),
              abbr: abbr.trim(),
              en: { title: enTitle.trim(), def: enDef.trim(), example: enExample.trim() },
              vi: { title: viTitle.trim(), def: viDef.trim(), example: viExample.trim() },
              tags: tags
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            };
            onSave?.(t);
          }}
          className="px-3 py-2 rounded-lg border bg-black text-white dark:bg-white dark:text-black"
        >
          Save
        </button>
        <button onClick={onCancel} className="px-3 py-2 rounded-lg border">Cancel</button>
      </div>
    </div>
  );
}

function useTerms() {
  const [terms, setTerms] = useLocalStorageState(STORAGE_KEY, seedTerms);
  const upsert = (t) => {
    setTerms((prev) => {
      const i = prev.findIndex((x) => x.id === t.id);
      if (i >= 0) {
        const copy = prev.slice();
        copy[i] = t;
        return copy;
      }
      return [...prev, t];
    });
  };
  const remove = (id) => setTerms((prev) => prev.filter((x) => x.id !== id));
  return { terms, upsert, remove };
}



function BackupSection({ terms }) {
  const { updateBackupDate } = useBackupDate();

  const exportTerms = () => {
    const blob = new Blob([JSON.stringify(terms, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bluwiki_terms.json";
    a.click();
    URL.revokeObjectURL(url);
    updateBackupDate();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="px-3 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-zinc-800"
        onClick={exportTerms}
      >
        📥 Export JSON
      </button>
      <label className="px-3 py-2 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
        📤 Import JSON
        <input
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const text = await f.text();
            try {
              const parsed = JSON.parse(text);
              if (Array.isArray(parsed)) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                location.reload();
              } else {
                alert("Invalid JSON format (expecting an array)");
              }
            } catch (err) {
              alert("Failed to parse JSON");
            }
          }}
        />
      </label>
    </div>
  );
}

function AppFooter({ terms }) {
  const { lastBackup, daysSinceBackup } = useBackupDate();
  
  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    try {
      return new Date(dateStr).toLocaleDateString('en-GB');
    } catch {
      return "Unknown";
    }
  };

  return (
    <footer className="mt-8 pt-4 border-t border-gray-200 dark:border-zinc-800 text-xs text-gray-500 dark:text-gray-400 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {terms.length} terms • Last backup: {formatDate(lastBackup)}
        </div>
        {daysSinceBackup > 7 && (
          <div className="text-amber-600 dark:text-amber-400">
            ⚠️ Consider backing up your data
          </div>
        )}
      </div>
    </footer>
  );
}

function StickyHeader({ appState, tab, setTab }) {
  return (
    <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-zinc-800/50 print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-bold tracking-tight">BluWiki</h1>
              <p className="text-xs text-gray-600 dark:text-gray-300 hidden sm:block">Personal bilingual wiki + converters</p>
            </div>
            <nav className="flex items-center gap-2">
              <TabBtn active={tab === "glossary"} onClick={() => setTab("glossary")}>
                Glossary
              </TabBtn>
              <TabBtn active={tab === "converters"} onClick={() => setTab("converters")}>
                Converters
              </TabBtn>
            </nav>
          </div>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                ref={appState.searchInputRef}
                className="w-full rounded-xl border px-3 py-2 pl-8 text-sm focus:outline-none focus:ring bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700"
                value={appState.globalSearch}
                placeholder="Search terms... (press '/' to focus)"
                onChange={(e) => appState.setGlobalSearch(e.target.value)}
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </div>
              {appState.globalSearch && (
                <button
                  onClick={() => appState.setGlobalSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BluWiki() {
  const [tab, setTab] = useState("glossary");
  const appState = useAppState();
  const { terms } = useTerms();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <StickyHeader appState={appState} tab={tab} setTab={setTab} />
      
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="mt-6">
          {tab === "glossary" && <Glossary appState={appState} />}
          {tab === "converters" && <Converters />}
        </div>
        
        <AppFooter terms={terms} />
      </div>
    </div>
  );
}

// Add missing hooks before existing functions
function useAppState() {
  const [terms, setTerms] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : seedTerms;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [activeTag, setActiveTag] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('bluwiki.darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const { fold, occ, editDistLe1 } = useEnhancedSearch();

  // Save to localStorage whenever terms change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
  }, [terms]);

  // Handle dark mode persistence and apply to document
  useEffect(() => {
    localStorage.setItem('bluwiki.darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Enhanced search with relevance scoring
  const filteredTerms = useMemo(() => {
    let filtered = terms;

    // Filter by active tag
    if (activeTag) {
      filtered = filtered.filter(term => term.tags?.includes(activeTag));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      filtered = filtered
        .map(term => {
          let score = 0;
          
          // Get searchable text from bilingual structure
          const abbr = term.abbr || term.term || '';
          const enTitle = term.en?.title || '';
          const enDef = term.en?.def || term.definition || '';
          const viTitle = term.vi?.title || '';
          const viDef = term.vi?.def || '';
          
          // Exact matches get highest score
          if (fold(abbr).includes(fold(query))) score += 100;
          if (fold(enTitle).includes(fold(query))) score += 90;
          if (fold(viTitle).includes(fold(query))) score += 90;
          if (fold(enDef).includes(fold(query))) score += 50;
          if (fold(viDef).includes(fold(query))) score += 50;
          
          // Fuzzy matches
          if (editDistLe1(query, abbr)) score += 80;
          if (editDistLe1(query, enTitle)) score += 70;
          if (editDistLe1(query, viTitle)) score += 70;
          
          // Occurrence counting
          score += occ(query, abbr) * 30;
          score += occ(query, enTitle) * 25;
          score += occ(query, viTitle) * 25;
          score += occ(query, enDef) * 10;
          score += occ(query, viDef) * 10;
          
          // Tag matches
          if (term.tags?.some(tag => fold(tag).includes(fold(query)))) score += 40;
          
          return { ...term, relevanceScore: score };
        })
        .filter(term => term.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    return filtered;
  }, [terms, searchQuery, activeTag, fold, occ, editDistLe1]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set();
    terms.forEach(term => {
      term.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [terms]);

  const addTerm = (newTerm) => {
    const term = {
      ...newTerm,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setTerms(prev => [term, ...prev]);
    setIsAddingTerm(false);
  };

  const updateTerm = (id, updatedTerm) => {
    setTerms(prev => prev.map(term => 
      term.id === id ? { ...term, ...updatedTerm } : term
    ));
    setSelectedTerm(null);
  };

  const deleteTerm = (id) => {
    setTerms(prev => prev.filter(term => term.id !== id));
    setSelectedTerm(null);
  };

  const copyAsMarkdown = (term) => {
    const abbr = term.abbr || term.term || 'Unknown';
    const enTitle = term.en?.title || '';
    const enDef = term.en?.def || term.definition || '';
    const viTitle = term.vi?.title || '';
    const viDef = term.vi?.def || '';
    
    let markdown = `## ${abbr}\n\n`;
    
    if (enTitle || enDef) {
      markdown += `### English\n`;
      if (enTitle) markdown += `**${enTitle}**\n\n`;
      if (enDef) markdown += `${enDef}\n\n`;
    }
    
    if (viTitle || viDef) {
      markdown += `### Vietnamese\n`;
      if (viTitle) markdown += `**${viTitle}**\n\n`;
      if (viDef) markdown += `${viDef}\n\n`;
    }
    
    if (term.tags?.length) {
      markdown += `**Tags:** ${term.tags.join(', ')}`;
    }
    
    navigator.clipboard.writeText(markdown);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(terms, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'blu-wiki-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedTerms = JSON.parse(e.target.result);
          setTerms(importedTerms);
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };
  
  return {
    searchQuery,
    setSearchQuery,
    activeTag,
    setActiveTag,
    allTags,
    filteredTerms,
    selectedTerm,
    setSelectedTerm,
    isAddingTerm,
    setIsAddingTerm,
    addTerm,
    updateTerm,
    deleteTerm,
    copyAsMarkdown,
    exportData,
    importData,
    showCommandPalette,
    setShowCommandPalette,
    isPrintMode,
    setIsPrintMode,
    isDarkMode,
    toggleDarkMode,
    terms
  };
}

function useBackupDate() {
  const [lastBackup, setLastBackup] = useLocalStorageState("bluwiki.lastBackup", null);
  
  const updateBackupDate = () => {
    setLastBackup(new Date().toISOString());
  };
  
  const daysSinceBackup = useMemo(() => {
    if (!lastBackup) return 999;
    try {
      const diffTime = Date.now() - new Date(lastBackup).getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  }, [lastBackup]);
  
  return { lastBackup, daysSinceBackup, updateBackupDate };
}

function useEnhancedSearch() {
  const fold = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const occ = (needle, haystack = "") => {
    needle = fold(needle); haystack = fold(haystack);
    let index = 0, count = 0; while ((index = haystack.indexOf(needle, index)) !== -1) { count++; index += needle.length; } return count;
  };
  const editDistLe1 = (a, b) => {
    a = fold(a); b = fold(b);
    if (Math.abs(a.length - b.length) > 1) return false;
    if (a === b) return true;
    const [s, l] = a.length <= b.length ? [a, b] : [b, a];
    for (let i = 0; i <= s.length; i++) {
      if (s === l.slice(0, i) + l.slice(i + 1)) return true;
      if (i < s.length && s.slice(0, i) + s.slice(i + 1) === l) return true;
      if (i < s.length && s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2) === l) return true;
    }
    return false;
  };
  return { fold, occ, editDistLe1 };
}

// Main App component
function App() {
  const [terms, setTerms] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : seedTerms;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [activeTag, setActiveTag] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('bluwiki.darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const { fold, occ, editDistLe1 } = useEnhancedSearch();

  // Save to localStorage whenever terms change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
  }, [terms]);

  // Handle URL permalinks
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const term = terms.find(t => t.id === hash);
        if (term) setSelectedTerm(term);
      }
    };

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query) setSearchQuery(query);

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [terms]);

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.querySelector('input[type="search"]')?.focus();
      } else if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsAddingTerm(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      } else if (e.key === 'Escape') {
        setSelectedTerm(null);
        setIsAddingTerm(false);
        setShowCommandPalette(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Enhanced search with relevance scoring
  const filteredTerms = useMemo(() => {
    let filtered = terms;

    // Filter by active tag
    if (activeTag) {
      filtered = filtered.filter(term => term.tags?.includes(activeTag));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      filtered = filtered
        .map(term => {
          let score = 0;
          
          // Exact matches get highest score
          if (fold(term.term).includes(fold(query))) score += 100;
          if (fold(term.definition).includes(fold(query))) score += 50;
          
          // Fuzzy matches
          if (editDistLe1(query, term.term)) score += 80;
          
          // Occurrence counting
          score += occ(query, term.term) * 30;
          score += occ(query, term.definition) * 10;
          
          // Tag matches
          if (term.tags?.some(tag => fold(tag).includes(fold(query)))) score += 40;
          
          return { ...term, relevanceScore: score };
        })
        .filter(term => term.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    return filtered;
  }, [terms, searchQuery, activeTag, fold, occ, editDistLe1]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set();
    terms.forEach(term => {
      term.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [terms]);

  const addTerm = (newTerm) => {
    const term = {
      ...newTerm,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setTerms(prev => [term, ...prev]);
    setIsAddingTerm(false);
  };

  const updateTerm = (id, updatedTerm) => {
    setTerms(prev => prev.map(term => 
      term.id === id ? { ...term, ...updatedTerm } : term
    ));
    setSelectedTerm(null);
  };

  const deleteTerm = (id) => {
    setTerms(prev => prev.filter(term => term.id !== id));
    setSelectedTerm(null);
  };

  const copyAsMarkdown = (term) => {
    const markdown = `## ${term.term}\n\n${term.definition}${term.tags?.length ? `\n\n**Tags:** ${term.tags.join(', ')}` : ''}`;
    navigator.clipboard.writeText(markdown);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(terms, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'blu-wiki-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedTerms = JSON.parse(e.target.result);
          setTerms(importedTerms);
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const appState = {
    searchQuery,
    setSearchQuery,
    activeTag,
    setActiveTag,
    allTags,
    filteredTerms,
    selectedTerm,
    setSelectedTerm,
    isAddingTerm,
    setIsAddingTerm,
    addTerm,
    updateTerm,
    deleteTerm,
    copyAsMarkdown,
    exportData,
    importData,
    showCommandPalette,
    setShowCommandPalette,
    isPrintMode,
    setIsPrintMode,
    isDarkMode,
    toggleDarkMode
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 ${isPrintMode ? 'print-mode' : ''}`}>
      <Header appState={appState} />
      <main className="container mx-auto px-4 py-8">
        <Glossary appState={appState} />
      </main>
      <Footer terms={terms} />
      {showCommandPalette && <CommandPalette appState={appState} />}
      {selectedTerm && <TermModal appState={appState} />}
      {isAddingTerm && <AddTermModal appState={appState} />}
    </div>
  );
}

// Header component
function Header({ appState }) {
  const { searchQuery, setSearchQuery, exportData, importData, setShowCommandPalette, isPrintMode, setIsPrintMode, isDarkMode, toggleDarkMode } = appState;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-zinc-800 shadow-sm border-b border-gray-200 dark:border-zinc-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">BluWiki</h1>
          
          <div className="flex-1 max-w-md">
            <input
              type="search"
              placeholder="Search terms... (Press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              title="Command Palette (Ctrl/⌘+K)"
            >
              ⌘K
            </button>
            
            <button
              onClick={toggleDarkMode}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            
            <button
              onClick={() => setIsPrintMode(!isPrintMode)}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              title="Toggle Print Mode"
            >
              🖨️
            </button>
            
            <button
              onClick={exportData}
              className="px-3 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors"
              title="Export Data"
            >
              Export
            </button>
            
            <label className="px-3 py-2 text-sm bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 rounded-lg transition-colors cursor-pointer">
              Import
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </header>
  );
}

// Footer component
function Footer({ terms }) {
  const totalTerms = terms.length;
  const totalTags = new Set(terms.flatMap(term => term.tags || [])).size;
  const lastUpdated = terms.length > 0 ? new Date(Math.max(...terms.map(t => new Date(t.createdAt || Date.now())))).toLocaleDateString() : 'Never';

  return (
    <footer className="bg-gray-100 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 mt-8">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex gap-6">
            <span>{totalTerms} terms</span>
            <span>{totalTags} tags</span>
            <span>Last updated: {lastUpdated}</span>
          </div>
          
          <div className="text-xs">
            💡 Remember to backup your data regularly!
          </div>
        </div>
      </div>
    </footer>
  );
}

// Command Palette component
function CommandPalette({ appState }) {
  const { setShowCommandPalette, setIsAddingTerm, exportData, setIsPrintMode, toggleDarkMode } = appState;
  
  const commands = [
    { id: 'add', label: 'Add New Term', action: () => setIsAddingTerm(true) },
    { id: 'export', label: 'Export Data', action: exportData },
    { id: 'print', label: 'Toggle Print Mode', action: () => setIsPrintMode(prev => !prev) },
    { id: 'dark', label: 'Toggle Dark Mode', action: toggleDarkMode },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Command Palette</h3>
        </div>
        <div className="p-2">
          {commands.map(cmd => (
            <button
              key={cmd.id}
              onClick={() => {
                cmd.action();
                setShowCommandPalette(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-900 dark:text-gray-100 rounded transition-colors"
            >
              {cmd.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-zinc-700 text-xs text-gray-500 dark:text-gray-400">
          Press Escape to close
        </div>
      </div>
    </div>
  );
}

// Glossary component
function Glossary({ appState }) {
  const { 
    filteredTerms, 
    selectedTerm, 
    setSelectedTerm, 
    activeTag, 
    setActiveTag, 
    allTags, 
    searchQuery,
    setIsAddingTerm 
  } = appState;

  if (filteredTerms.length === 0 && searchQuery.trim()) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2 dark:text-gray-200">No results found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search or browse by tags</p>
        <button
          onClick={() => setIsAddingTerm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Term
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag('')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              !activeTag ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
            }`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                activeTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Terms Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTerms.map(term => (
          <TermCard
            key={term.id}
            term={term}
            onClick={() => {
              setSelectedTerm(term);
              window.location.hash = term.id;
            }}
            onTagClick={(tag) => setActiveTag(tag)}
          />
        ))}
      </div>
    </div>
  );
}

// Term Card component
function TermCard({ term, onClick, onTagClick }) {
  return (
    <div
      className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 hover:shadow-md dark:hover:shadow-zinc-900/20 transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="mb-2">
        <h3 className="font-semibold text-lg text-blue-600 dark:text-blue-400">{term.abbr}</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="font-medium">{term.en?.title}</div>
          {term.vi?.title && <div className="italic">{term.vi.title}</div>}
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-3">
        {term.en?.def || term.definition}
      </p>
      
      {term.tags && term.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {term.tags.map(tag => (
            <span
              key={tag}
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tag);
              }}
              className="px-2 py-1 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Term Modal component
function TermModal({ appState }) {
  const { selectedTerm, setSelectedTerm, updateTerm, deleteTerm, copyAsMarkdown } = appState;
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    abbr: selectedTerm?.abbr || '',
    enTitle: selectedTerm?.en?.title || '',
    enDef: selectedTerm?.en?.def || '',
    enExample: selectedTerm?.en?.example || '',
    viTitle: selectedTerm?.vi?.title || '',
    viDef: selectedTerm?.vi?.def || '',
    viExample: selectedTerm?.vi?.example || '',
    tags: selectedTerm?.tags?.join(', ') || ''
  });

  const handleSave = () => {
    updateTerm(selectedTerm.id, {
      abbr: editForm.abbr,
      en: {
        title: editForm.enTitle,
        def: editForm.enDef,
        example: editForm.enExample
      },
      vi: {
        title: editForm.viTitle,
        def: editForm.viDef,
        example: editForm.viExample
      },
      tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });
    setIsEditing(false);
  };

  if (!selectedTerm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {isEditing ? (
                <input
                  value={editForm.abbr}
                  onChange={(e) => setEditForm(prev => ({ ...prev, abbr: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 text-2xl font-bold"
                  placeholder="Abbreviation"
                />
              ) : (
                <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedTerm.abbr}</h2>
              )}
            </div>
            <button
              onClick={() => setSelectedTerm(null)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl ml-4"
            >
              ×
            </button>
          </div>
          
          {/* English Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
              <span className="mr-2">🇺🇸</span> English
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
                {isEditing ? (
                  <input
                    value={editForm.enTitle}
                    onChange={(e) => setEditForm(prev => ({ ...prev, enTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                    placeholder="English title"
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{selectedTerm.en?.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Definition</label>
                {isEditing ? (
                  <textarea
                    value={editForm.enDef}
                    onChange={(e) => setEditForm(prev => ({ ...prev, enDef: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg h-24 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                    placeholder="English definition"
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedTerm.en?.def}</p>
                )}
              </div>
              {(selectedTerm.en?.example || isEditing) && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Example</label>
                  {isEditing ? (
                    <textarea
                      value={editForm.enExample}
                      onChange={(e) => setEditForm(prev => ({ ...prev, enExample: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg h-20 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                      placeholder="English example"
                    />
                  ) : (
                    selectedTerm.en?.example && <p className="text-gray-600 dark:text-gray-400 italic">{selectedTerm.en.example}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Vietnamese Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
              <span className="mr-2">🇻🇳</span> Tiếng Việt
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tiêu đề</label>
                {isEditing ? (
                  <input
                    value={editForm.viTitle}
                    onChange={(e) => setEditForm(prev => ({ ...prev, viTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                    placeholder="Vietnamese title"
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{selectedTerm.vi?.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Định nghĩa</label>
                {isEditing ? (
                  <textarea
                    value={editForm.viDef}
                    onChange={(e) => setEditForm(prev => ({ ...prev, viDef: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg h-24 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                    placeholder="Vietnamese definition"
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedTerm.vi?.def}</p>
                )}
              </div>
              {(selectedTerm.vi?.example || isEditing) && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Ví dụ</label>
                  {isEditing ? (
                    <textarea
                      value={editForm.viExample}
                      onChange={(e) => setEditForm(prev => ({ ...prev, viExample: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg h-20 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                      placeholder="Vietnamese example"
                    />
                  ) : (
                    selectedTerm.vi?.example && <p className="text-gray-600 dark:text-gray-400 italic">{selectedTerm.vi.example}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {(selectedTerm.tags?.length > 0 || isEditing) && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
              {isEditing ? (
                <input
                  value={editForm.tags}
                  onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedTerm.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 text-sm rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-zinc-700">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-zinc-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-zinc-500 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => copyAsMarkdown(selectedTerm)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Copy as Markdown
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this term?')) {
                      deleteTerm(selectedTerm.id);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Term Modal component
function AddTermModal({ appState }) {
  const { setIsAddingTerm, addTerm } = appState;
  const [form, setForm] = useState({ 
    abbr: '', 
    enTitle: '', 
    enDef: '', 
    enExample: '',
    viTitle: '', 
    viDef: '', 
    viExample: '',
    tags: '' 
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.abbr.trim() && (form.enDef.trim() || form.viDef.trim())) {
      const newTerm = {
        abbr: form.abbr,
        en: {
          title: form.enTitle,
          def: form.enDef,
          example: form.enExample
        },
        vi: {
          title: form.viTitle,
          def: form.viDef,
          example: form.viExample
        },
        tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };
      addTerm(newTerm);
      setForm({ 
        abbr: '', 
        enTitle: '', 
        enDef: '', 
        enExample: '',
        viTitle: '', 
        viDef: '', 
        viExample: '',
        tags: '' 
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-gray-200">Add New Term</h2>
            <button
              type="button"
              onClick={() => setIsAddingTerm(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Abbreviation</label>
              <input
                type="text"
                value={form.abbr}
                onChange={(e) => setForm(prev => ({ ...prev, abbr: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                placeholder="e.g., HTTP, TCP, DNS"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">English</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={form.enTitle}
                    onChange={(e) => setForm(prev => ({ ...prev, enTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                    placeholder="English title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Definition</label>
                  <textarea
                    value={form.enDef}
                    onChange={(e) => setForm(prev => ({ ...prev, enDef: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                    placeholder="English definition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Example</label>
                  <textarea
                    value={form.enExample}
                    onChange={(e) => setForm(prev => ({ ...prev, enExample: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-16 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                    placeholder="English example"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Vietnamese</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tiêu đề</label>
                  <input
                    type="text"
                    value={form.viTitle}
                    onChange={(e) => setForm(prev => ({ ...prev, viTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                    placeholder="Vietnamese title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Định nghĩa</label>
                  <textarea
                    value={form.viDef}
                    onChange={(e) => setForm(prev => ({ ...prev, viDef: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                    placeholder="Vietnamese definition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ví dụ</label>
                  <textarea
                    value={form.viExample}
                    onChange={(e) => setForm(prev => ({ ...prev, viExample: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-16 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                    placeholder="Vietnamese example"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 mt-6 border-t border-gray-200 dark:border-zinc-700">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Term
            </button>
            <button
              type="button"
              onClick={() => setIsAddingTerm(false)}
              className="px-4 py-2 bg-gray-300 dark:bg-zinc-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-zinc-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
