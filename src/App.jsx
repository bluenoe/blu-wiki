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
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{subtitle}</p>
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

function Glossary() {
  const { terms, upsert, remove } = useTerms();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const arr = [...terms];
    if (!s) return arr.sort((a,b)=>a.abbr.localeCompare(b.abbr));
    const occ = (n,h="")=>{
      n=n.toLowerCase(); h=(h||"").toLowerCase();
      let i=0,c=0; while((i=h.indexOf(n,i))!==-1){c++; i+=n.length;} return c;
    };
    const score = (t)=>{
      const w = {exact:100,prefix:50,inAbbr:5,inTitle:3,inDef:1,inTags:2};
      const ab=(t.abbr||"").toLowerCase();
      let sc=0;
      if(ab===s) sc+=w.exact;
      if(ab.startsWith(s)) sc+=w.prefix;
      sc+=occ(s,t.abbr)*w.inAbbr;
      sc+=occ(s,(t.en?.title||"")+" "+(t.vi?.title||""))*w.inTitle;
      sc+=occ(s,(t.en?.def||"")+" "+(t.vi?.def||""))*w.inDef;
      sc+=occ(s,(t.tags||[]).join(" "))*w.inTags;
      return sc;
    };
    return arr.map(t=>({t,s:score(t)}))
      .filter(x=>x.s>0)
      .sort((a,b)=>(b.s-a.s)||a.t.abbr.localeCompare(b.t.abbr))
      .map(x=>x.t);
  }, [terms,q]);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <SectionCard
          title="Glossary / Từ vựng"
          subtitle="Song ngữ EN–VI, tập trung IT & mạng"
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing({})}
                className="text-xs px-3 py-1 rounded-lg border"
              >
                + Add
              </button>
            </div>
          }
        >
          <Field label="Search / Tìm kiếm" value={q} onChange={setQ} placeholder="IP, TCP, DNS…" />
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[460px] overflow-auto pr-1">
            {list.map((t) => (
              <TermItem key={t.id} t={t} onSelect={setSelected} />
            ))}
            {!list.length && (
              <div className="text-sm text-gray-500">No results. Try another keyword.</div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="lg:col-span-2 grid gap-4">
        {editing ? (
          <TermEditor
            initial={editing?.id ? editing : null}
            onSave={(t) => {
              upsert(t);
              setEditing(null);
              setSelected(t);
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <TermDetail
            t={selected || list[0]}
            onEdit={() => setEditing(selected || list[0])}
            onDelete={() => {
              const target = selected || list[0];
              if (target && confirm(`Delete ${target.abbr}?`)) {
                remove(target.id);
                setSelected(null);
              }
            }}
          />
        )}

        <SectionCard title="Backup dữ liệu" subtitle="Sao lưu / Phục hồi glossary qua JSON">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="px-3 py-2 rounded-lg border"
              onClick={() => {
                const blob = new Blob([JSON.stringify(terms, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "bluwiki_terms.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export JSON
            </button>
            <label className="px-3 py-2 rounded-lg border cursor-pointer">
              Import JSON
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
        </SectionCard>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      className={classNames(
        "px-3 py-1.5 rounded-xl border text-sm",
        active ? "bg-black text-white dark:bg-white dark:text-black" : "bg-white dark:bg-zinc-900"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Global app state hooks
function useAppState() {
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedTermId, setSelectedTermId] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const searchInputRef = useRef(null);

  // URL sync for permalinks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const termId = window.location.hash.slice(1);
    
    if (q) setGlobalSearch(q);
    if (termId) setSelectedTermId(termId);
  }, []);

  useEffect(() => {
    if (globalSearch) {
      const params = new URLSearchParams();
      params.set('q', globalSearch);
      window.history.replaceState({}, '', '?' + params.toString());
    } else {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [globalSearch]);

  useEffect(() => {
    if (selectedTermId) {
      window.history.replaceState({}, '', '#' + selectedTermId);
    }
  }, [selectedTermId]);

  return {
    globalSearch, setGlobalSearch,
    selectedTermId, setSelectedTermId,
    activeTag, setActiveTag,
    searchInputRef
  };
}

// Enhanced search with diacritic folding and fuzzy matching
function useEnhancedSearch(terms, query, activeTag) {
  return useMemo(() => {
    let filtered = [...terms];
    
    // Filter by active tag first
    if (activeTag) {
      filtered = filtered.filter(t => t.tags?.includes(activeTag));
    }
    
    const s = fold(query.trim());
    if (!s) return filtered.sort((a,b)=>a.abbr.localeCompare(b.abbr));
    
    const score = (t) => {
      const w = {exact:100, prefix:50, fuzzy:25, inAbbr:10, inTitle:5, inDef:2, inTags:3};
      const ab = fold(t.abbr||"");
      let sc = 0;
      
      // Exact and prefix matches for abbreviation
      if (ab === s) sc += w.exact;
      else if (ab.startsWith(s)) sc += w.prefix;
      else if (editDistLe1(s, ab)) sc += w.fuzzy;
      
      // Fuzzy match for title
      const titleEn = fold(t.en?.title||"");
      const titleVi = fold(t.vi?.title||"");
      if (editDistLe1(s, titleEn) || editDistLe1(s, titleVi)) sc += w.fuzzy;
      
      // Occurrence-based scoring
      sc += occ(s, t.abbr) * w.inAbbr;
      sc += occ(s, (t.en?.title||"") + " " + (t.vi?.title||"")) * w.inTitle;
      sc += occ(s, (t.en?.def||"") + " " + (t.vi?.def||"")) * w.inDef;
      sc += occ(s, (t.tags||[]).join(" ")) * w.inTags;
      
      return sc;
    };
    
    return filtered.map(t=>({t,s:score(t)}))
      .filter(x=>x.s>0)
      .sort((a,b)=>(b.s-a.s)||a.t.abbr.localeCompare(b.t.abbr))
      .map(x=>x.t);
  }, [terms, query, activeTag]);
}

// Hotkeys hook
function useHotkeys(appState, onAddTerm) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus search on "/"
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          appState.searchInputRef.current?.focus();
        }
      }
      
      // Add term on "n"
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          onAddTerm();
        }
      }
      
      // Command palette on Ctrl/Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        appState.searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [appState, onAddTerm]);
}

// Backup date tracking
function useBackupDate() {
  const [lastBackup, setLastBackup] = useState(() => {
    try {
      return localStorage.getItem(BACKUP_KEY) || null;
    } catch {
      return null;
    }
  });

  const updateBackupDate = () => {
    const now = new Date().toISOString();
    setLastBackup(now);
    try {
      localStorage.setItem(BACKUP_KEY, now);
    } catch {}
  };

  const daysSinceBackup = lastBackup ? 
    Math.floor((Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24)) : 
    999;

  return { lastBackup, updateBackupDate, daysSinceBackup };
}

function Pill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "inline-block text-xs px-2 py-1 rounded-lg border cursor-pointer transition-colors",
        active 
          ? "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200"
          : "bg-gray-100 border-gray-300 text-gray-700 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
      )}
    >
      {children}
    </button>
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

function TermItem({ t, onSelect, isSelected }) {
  return (
    <button
      onClick={() => onSelect?.(t)}
      className={classNames(
        "w-full text-left rounded-xl border p-3 transition-colors",
        isSelected 
          ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-600"
          : "hover:bg-gray-50 dark:hover:bg-zinc-800 border-gray-200 dark:border-zinc-800"
      )}
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

function TermDetail({ t, onEdit, onDelete, appState }) {
  if (!t) return (
    <div className="rounded-2xl border bg-white/60 dark:bg-zinc-900/60 dark:border-zinc-800 p-8 text-center">
      <div className="text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-4">📚</div>
        <h3 className="text-lg font-medium mb-2">Select a term to view details</h3>
        <p className="text-sm">Choose from the list or search for specific terms</p>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border bg-white/60 dark:bg-zinc-900/60 dark:border-zinc-800 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
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
            <div className="mt-3 flex flex-wrap gap-1">
              {t.tags.map((tag) => (
                <Pill 
                  key={tag} 
                  active={appState.activeTag === tag}
                  onClick={() => appState.setActiveTag(appState.activeTag === tag ? null : tag)}
                >
                  {tag}
                </Pill>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <CopyMarkdownBtn term={t} />
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

function Glossary() {
  const { terms, upsert, remove } = useTerms();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const arr = [...terms];
    if (!s) return arr.sort((a,b)=>a.abbr.localeCompare(b.abbr));
    const occ = (n,h="")=>{
      n=n.toLowerCase(); h=(h||"").toLowerCase();
      let i=0,c=0; while((i=h.indexOf(n,i))!==-1){c++; i+=n.length;} return c;
    };
    const score = (t)=>{
      const w = {exact:100,prefix:50,inAbbr:5,inTitle:3,inDef:1,inTags:2};
      const ab=(t.abbr||"").toLowerCase();
      let sc=0;
      if(ab===s) sc+=w.exact;
      if(ab.startsWith(s)) sc+=w.prefix;
      sc+=occ(s,t.abbr)*w.inAbbr;
      sc+=occ(s,(t.en?.title||"")+" "+(t.vi?.title||""))*w.inTitle;
      sc+=occ(s,(t.en?.def||"")+" "+(t.vi?.def||""))*w.inDef;
      sc+=occ(s,(t.tags||[]).join(" "))*w.inTags;
      return sc;
    };
    return arr.map(t=>({t,s:score(t)}))
      .filter(x=>x.s>0)
      .sort((a,b)=>(b.s-a.s)||a.t.abbr.localeCompare(b.t.abbr))
      .map(x=>x.t);
  }, [terms,q]);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <SectionCard
          title="Glossary / Từ vựng"
          subtitle="Song ngữ EN–VI, tập trung IT & mạng"
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing({})}
                className="text-xs px-3 py-1 rounded-lg border"
              >
                + Add
              </button>
            </div>
          }
        >
          <Field label="Search / Tìm kiếm" value={q} onChange={setQ} placeholder="IP, TCP, DNS…" />
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[460px] overflow-auto pr-1">
            {list.map((t) => (
              <TermItem key={t.id} t={t} onSelect={setSelected} />
            ))}
            {!list.length && (
              <div className="text-sm text-gray-500">No results. Try another keyword.</div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="lg:col-span-2 grid gap-4">
        {editing ? (
          <TermEditor
            initial={editing?.id ? editing : null}
            onSave={(t) => {
              upsert(t);
              setEditing(null);
              setSelected(t);
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <TermDetail
            t={selected || list[0]}
            onEdit={() => setEditing(selected || list[0])}
            onDelete={() => {
              const target = selected || list[0];
              if (target && confirm(`Delete ${target.abbr}?`)) {
                remove(target.id);
                setSelected(null);
              }
            }}
          />
        )}

        <SectionCard title="Backup dữ liệu" subtitle="Sao lưu / Phục hồi glossary qua JSON">
          <BackupSection terms={terms} />
        </SectionCard>
      </div>
    </div>
  );
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
