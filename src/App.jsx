import React, { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from '@tanstack/react-virtual';

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
  {
    id: "nat",
    abbr: "NAT",
    en: {
      title: "Network Address Translation",
      def: "Technique that maps private IP addresses to public ones, allowing multiple devices to share a single public IP.",
      example: "Your home router uses NAT to allow all devices to access the internet through one public IP.",
    },
    vi: {
      title: "Dịch địa chỉ mạng",
      def: "Kỹ thuật ánh xạ địa chỉ IP riêng tư sang công cộng, cho phép nhiều thiết bị dùng chung một IP công cộng.",
      example: "Router gia đình dùng NAT để tất cả thiết bị truy cập internet qua một IP công cộng.",
    },
    tags: ["network"],
  },
  {
    id: "vpn",
    abbr: "VPN",
    en: {
      title: "Virtual Private Network",
      def: "Secure tunnel over public networks that encrypts traffic and masks user location.",
      example: "Using VPN to securely access company resources from home.",
    },
    vi: {
      title: "Mạng riêng ảo",
      def: "Đường hầm bảo mật qua mạng công cộng, mã hóa lưu lượng và che giấu vị trí người dùng.",
      example: "Dùng VPN để truy cập tài nguyên công ty từ nhà một cách an toàn.",
    },
    tags: ["network", "security"],
  },
  {
    id: "vlan",
    abbr: "VLAN",
    en: {
      title: "Virtual LAN",
      def: "Logical segmentation of a physical network to create separate broadcast domains.",
      example: "Separating guest WiFi from corporate network using VLANs.",
    },
    vi: {
      title: "Mạng LAN ảo",
      def: "Phân đoạn logic của mạng vật lý để tạo các miền quảng bá riêng biệt.",
      example: "Tách WiFi khách với mạng công ty bằng VLAN.",
    },
    tags: ["network"],
  },
  {
    id: "wan",
    abbr: "WAN",
    en: {
      title: "Wide Area Network",
      def: "Network spanning large geographical areas, connecting multiple LANs across cities or countries.",
      example: "The Internet is the largest WAN connecting networks worldwide.",
    },
    vi: {
      title: "Mạng diện rộng",
      def: "Mạng trải rộng trên khu vực địa lý lớn, kết nối nhiều LAN qua các thành phố hoặc quốc gia.",
      example: "Internet là WAN lớn nhất kết nối các mạng trên toàn thế giới.",
    },
    tags: ["network"],
  },
  {
    id: "man",
    abbr: "MAN",
    en: {
      title: "Metropolitan Area Network",
      def: "Network covering a city or metropolitan area, larger than LAN but smaller than WAN.",
      example: "City-wide fiber network connecting government buildings.",
    },
    vi: {
      title: "Mạng đô thị",
      def: "Mạng bao phủ một thành phố hoặc khu vực đô thị, lớn hơn LAN nhưng nhỏ hơn WAN.",
      example: "Mạng cáp quang toàn thành phố kết nối các tòa nhà chính phủ.",
    },
    tags: ["network"],
  },
  {
    id: "isp",
    abbr: "ISP",
    en: {
      title: "Internet Service Provider",
      def: "Company that provides internet access to customers through various technologies.",
      example: "Comcast, Verizon are major ISPs in the US.",
    },
    vi: {
      title: "Nhà cung cấp dịch vụ Internet",
      def: "Công ty cung cấp truy cập internet cho khách hàng thông qua các công nghệ khác nhau.",
      example: "FPT, Viettel là các ISP lớn tại Việt Nam.",
    },
    tags: ["network"],
  },
  {
    id: "mac",
    abbr: "MAC",
    en: {
      title: "Media Access Control",
      def: "Unique hardware identifier assigned to network interfaces, used in data link layer.",
      example: "MAC address: 00:1B:44:11:3A:B7 identifies a specific network card.",
    },
    vi: {
      title: "Điều khiển truy cập phương tiện",
      def: "Định danh phần cứng duy nhất gán cho giao diện mạng, dùng ở tầng liên kết dữ liệu.",
      example: "Địa chỉ MAC: 00:1B:44:11:3A:B7 xác định một card mạng cụ thể.",
    },
    tags: ["network"],
  },
  {
    id: "arp",
    abbr: "ARP",
    en: {
      title: "Address Resolution Protocol",
      def: "Protocol that maps IP addresses to MAC addresses in local networks.",
      example: "ARP table shows which MAC address corresponds to IP 192.168.1.1.",
    },
    vi: {
      title: "Giao thức phân giải địa chỉ",
      def: "Giao thức ánh xạ địa chỉ IP sang địa chỉ MAC trong mạng cục bộ.",
      example: "Bảng ARP hiển thị địa chỉ MAC nào tương ứng với IP 192.168.1.1.",
    },
    tags: ["network"],
  },
  {
    id: "icmp",
    abbr: "ICMP",
    en: {
      title: "Internet Control Message Protocol",
      def: "Protocol for sending error messages and operational information in IP networks.",
      example: "Ping command uses ICMP to test network connectivity.",
    },
    vi: {
      title: "Giao thức thông báo điều khiển Internet",
      def: "Giao thức gửi thông báo lỗi và thông tin vận hành trong mạng IP.",
      example: "Lệnh ping dùng ICMP để kiểm tra kết nối mạng.",
    },
    tags: ["network"],
  },
  {
    id: "bgp",
    abbr: "BGP",
    en: {
      title: "Border Gateway Protocol",
      def: "Routing protocol used between autonomous systems on the Internet.",
      example: "ISPs use BGP to exchange routing information globally.",
    },
    vi: {
      title: "Giao thức cổng biên",
      def: "Giao thức định tuyến dùng giữa các hệ thống tự trị trên Internet.",
      example: "Các ISP dùng BGP để trao đổi thông tin định tuyến toàn cầu.",
    },
    tags: ["network", "routing"],
  },
  {
    id: "ospf",
    abbr: "OSPF",
    en: {
      title: "Open Shortest Path First",
      def: "Link-state routing protocol that uses Dijkstra's algorithm to find shortest paths.",
      example: "Enterprise networks use OSPF for fast convergence and loop-free routing.",
    },
    vi: {
      title: "Đường đi ngắn nhất mở đầu tiên",
      def: "Giao thức định tuyến trạng thái liên kết dùng thuật toán Dijkstra tìm đường ngắn nhất.",
      example: "Mạng doanh nghiệp dùng OSPF để hội tụ nhanh và định tuyến không vòng lặp.",
    },
    tags: ["network", "routing"],
  },
  {
    id: "rip",
    abbr: "RIP",
    en: {
      title: "Routing Information Protocol",
      def: "Distance-vector routing protocol that uses hop count as routing metric.",
      example: "RIP limits networks to 15 hops to prevent routing loops.",
    },
    vi: {
      title: "Giao thức thông tin định tuyến",
      def: "Giao thức định tuyến vector khoảng cách dùng số bước nhảy làm thước đo định tuyến.",
      example: "RIP giới hạn mạng tối đa 15 bước nhảy để tránh vòng lặp định tuyến.",
    },
    tags: ["network", "routing"],
  },
  {
    id: "cdn",
    abbr: "CDN",
    en: {
      title: "Content Delivery Network",
      def: "Distributed network of servers that deliver web content based on user location.",
      example: "Netflix uses CDN to stream videos from servers closest to viewers.",
    },
    vi: {
      title: "Mạng phân phối nội dung",
      def: "Mạng máy chủ phân tán cung cấp nội dung web dựa trên vị trí người dùng.",
      example: "Netflix dùng CDN để phát video từ máy chủ gần người xem nhất.",
    },
    tags: ["network", "web"],
  },
  {
    id: "voip",
    abbr: "VoIP",
    en: {
      title: "Voice over IP",
      def: "Technology for voice communication over Internet Protocol networks.",
      example: "Skype and WhatsApp calls use VoIP technology.",
    },
    vi: {
      title: "Thoại qua IP",
      def: "Công nghệ truyền thoại qua mạng giao thức Internet.",
      example: "Cuộc gọi Skype và WhatsApp dùng công nghệ VoIP.",
    },
    tags: ["network", "communication"],
  },
  {
    id: "qos",
    abbr: "QoS",
    en: {
      title: "Quality of Service",
      def: "Network management technique to prioritize certain types of traffic.",
      example: "QoS ensures video calls get priority over file downloads.",
    },
    vi: {
      title: "Chất lượng dịch vụ",
      def: "Kỹ thuật quản lý mạng để ưu tiên các loại lưu lượng nhất định.",
      example: "QoS đảm bảo cuộc gọi video được ưu tiên hơn tải file.",
    },
    tags: ["network"],
  },
  {
    id: "ids",
    abbr: "IDS",
    en: {
      title: "Intrusion Detection System",
      def: "Security system that monitors network traffic for suspicious activities.",
      example: "IDS alerts administrators when detecting potential cyber attacks.",
    },
    vi: {
      title: "Hệ thống phát hiện xâm nhập",
      def: "Hệ thống bảo mật giám sát lưu lượng mạng tìm hoạt động đáng ngờ.",
      example: "IDS cảnh báo quản trị viên khi phát hiện tấn công mạng tiềm ẩn.",
    },
    tags: ["security"],
  },
  {
    id: "ips",
    abbr: "IPS",
    en: {
      title: "Intrusion Prevention System",
      def: "Security system that actively blocks detected threats in real-time.",
      example: "IPS automatically drops malicious packets before they reach targets.",
    },
    vi: {
      title: "Hệ thống ngăn chặn xâm nhập",
      def: "Hệ thống bảo mật chủ động chặn các mối đe dọa được phát hiện theo thời gian thực.",
      example: "IPS tự động loại bỏ gói tin độc hại trước khi chúng đến đích.",
    },
    tags: ["security"],
  },
  {
    id: "mfa",
    abbr: "MFA",
    en: {
      title: "Multi-Factor Authentication",
      def: "Security method requiring multiple verification factors to access accounts.",
      example: "Banking apps use MFA with password + SMS code + fingerprint.",
    },
    vi: {
      title: "Xác thực đa yếu tố",
      def: "Phương pháp bảo mật yêu cầu nhiều yếu tố xác minh để truy cập tài khoản.",
      example: "Ứng dụng ngân hàng dùng MFA với mật khẩu + mã SMS + vân tay.",
    },
    tags: ["security"],
  },
  {
    id: "pki",
    abbr: "PKI",
    en: {
      title: "Public Key Infrastructure",
      def: "Framework for managing digital certificates and public-key encryption.",
      example: "PKI enables secure HTTPS connections through certificate authorities.",
    },
    vi: {
      title: "Hạ tầng khóa công khai",
      def: "Khung quản lý chứng chỉ số và mã hóa khóa công khai.",
      example: "PKI cho phép kết nối HTTPS an toàn thông qua cơ quan chứng chỉ.",
    },
    tags: ["security", "encryption"],
  },
  {
    id: "aes",
    abbr: "AES",
    en: {
      title: "Advanced Encryption Standard",
      def: "Symmetric encryption algorithm widely used for securing sensitive data.",
      example: "AES-256 encryption protects files, WiFi, and online transactions.",
    },
    vi: {
      title: "Tiêu chuẩn mã hóa nâng cao",
      def: "Thuật toán mã hóa đối xứng được dùng rộng rãi để bảo mật dữ liệu nhạy cảm.",
      example: "Mã hóa AES-256 bảo vệ file, WiFi và giao dịch trực tuyến.",
    },
    tags: ["security", "encryption"],
  },
  {
    id: "rsa",
    abbr: "RSA",
    en: {
      title: "Rivest–Shamir–Adleman (encryption)",
      def: "Public-key cryptosystem widely used for secure data transmission.",
      example: "RSA encryption secures online banking and email communications.",
    },
    vi: {
      title: "Rivest–Shamir–Adleman (mã hóa)",
      def: "Hệ mã hóa khóa công khai được dùng rộng rãi cho truyền dữ liệu an toàn.",
      example: "Mã hóa RSA bảo mật ngân hàng trực tuyến và email.",
    },
    tags: ["security", "encryption"],
  },
  {
    id: "md5",
    abbr: "MD5",
    en: {
      title: "Message Digest 5",
      def: "Cryptographic hash function producing 128-bit hash values, now considered weak.",
      example: "MD5 checksums verify file integrity but shouldn't be used for security.",
    },
    vi: {
      title: "Thông điệp tóm tắt 5",
      def: "Hàm băm mật mã tạo giá trị băm 128-bit, hiện được coi là yếu.",
      example: "Checksum MD5 xác minh tính toàn vẹn file nhưng không nên dùng cho bảo mật.",
    },
    tags: ["security", "hash"],
  },
  {
    id: "sha",
    abbr: "SHA",
    en: {
      title: "Secure Hash Algorithm",
      def: "Family of cryptographic hash functions including SHA-1, SHA-256, SHA-512.",
      example: "SHA-256 is used in Bitcoin blockchain for proof-of-work.",
    },
    vi: {
      title: "Thuật toán băm an toàn",
      def: "Họ hàm băm mật mã bao gồm SHA-1, SHA-256, SHA-512.",
      example: "SHA-256 được dùng trong blockchain Bitcoin cho proof-of-work.",
    },
    tags: ["security", "hash"],
  },
  {
    id: "jwt",
    abbr: "JWT",
    en: {
      title: "JSON Web Token",
      def: "Compact token format for securely transmitting information between parties.",
      example: "JWT tokens authenticate users in modern web applications.",
    },
    vi: {
      title: "Token web JSON",
      def: "Định dạng token nhỏ gọn để truyền thông tin an toàn giữa các bên.",
      example: "Token JWT xác thực người dùng trong ứng dụng web hiện đại.",
    },
    tags: ["web", "security"],
  },
  {
    id: "cors",
    abbr: "CORS",
    en: {
      title: "Cross-Origin Resource Sharing",
      def: "Mechanism allowing web pages to access resources from different domains.",
      example: "CORS headers enable API calls from frontend to backend on different ports.",
    },
    vi: {
      title: "Chia sẻ tài nguyên cross-origin",
      def: "Cơ chế cho phép trang web truy cập tài nguyên từ các domain khác.",
      example: "Header CORS cho phép gọi API từ frontend đến backend trên port khác.",
    },
    tags: ["web"],
  },
  {
    id: "rest",
    abbr: "REST",
    en: {
      title: "Representational State Transfer",
      def: "Architectural style for designing networked applications using HTTP methods.",
      example: "REST APIs use GET, POST, PUT, DELETE for resource operations.",
    },
    vi: {
      title: "Chuyển trạng thái đại diện",
      def: "Kiểu kiến trúc thiết kế ứng dụng mạng dùng phương thức HTTP.",
      example: "API REST dùng GET, POST, PUT, DELETE cho thao tác tài nguyên.",
    },
    tags: ["web", "api"],
  },
  {
    id: "soap",
    abbr: "SOAP",
    en: {
      title: "Simple Object Access Protocol",
      def: "Protocol for exchanging structured information in web services using XML.",
      example: "Enterprise systems often use SOAP for reliable web service communication.",
    },
    vi: {
      title: "Giao thức truy cập đối tượng đơn giản",
      def: "Giao thức trao đổi thông tin có cấu trúc trong web service dùng XML.",
      example: "Hệ thống doanh nghiệp thường dùng SOAP cho giao tiếp web service đáng tin cậy.",
    },
    tags: ["web", "api"],
  },
  {
    id: "orm",
    abbr: "ORM",
    en: {
      title: "Object-Relational Mapping",
      def: "Programming technique for converting data between incompatible type systems.",
      example: "Django ORM allows Python objects to interact with SQL databases.",
    },
    vi: {
      title: "Ánh xạ đối tượng-quan hệ",
      def: "Kỹ thuật lập trình chuyển đổi dữ liệu giữa các hệ thống kiểu không tương thích.",
      example: "Django ORM cho phép đối tượng Python tương tác với cơ sở dữ liệu SQL.",
    },
    tags: ["database", "programming"],
  },
  {
    id: "crud",
    abbr: "CRUD",
    en: {
      title: "Create, Read, Update, Delete",
      def: "Four basic operations for persistent storage in database applications.",
      example: "User management systems implement CRUD operations for user accounts.",
    },
    vi: {
      title: "Tạo, Đọc, Cập nhật, Xóa",
      def: "Bốn thao tác cơ bản cho lưu trữ bền vững trong ứng dụng cơ sở dữ liệu.",
      example: "Hệ thống quản lý người dùng thực hiện thao tác CRUD cho tài khoản.",
    },
    tags: ["database", "programming"],
  },
  {
    id: "cicd",
    abbr: "CI/CD",
    en: {
      title: "Continuous Integration / Continuous Deployment",
      def: "Development practice of frequent code integration and automated deployment.",
      example: "GitHub Actions enables CI/CD pipelines for automated testing and deployment.",
    },
    vi: {
      title: "Tích hợp liên tục / Triển khai liên tục",
      def: "Thực hành phát triển tích hợp code thường xuyên và triển khai tự động.",
      example: "GitHub Actions cho phép pipeline CI/CD để test và triển khai tự động.",
    },
    tags: ["development"],
  },
  {
    id: "dnssec",
    abbr: "DNSSEC",
    en: {
      title: "DNS Security Extensions",
      def: "Security extensions to DNS that provide authentication and data integrity.",
      example: "DNSSEC prevents DNS spoofing attacks by cryptographically signing DNS records.",
    },
    vi: {
      title: "Phần mở rộng bảo mật DNS",
      def: "Phần mở rộng bảo mật cho DNS cung cấp xác thực và tính toàn vẹn dữ liệu.",
      example: "DNSSEC ngăn tấn công giả mạo DNS bằng ký số các bản ghi DNS.",
    },
    tags: ["network", "security"],
  },
  {
    id: "dhcpv6",
    abbr: "DHCPv6",
    en: {
      title: "Dynamic Host Configuration Protocol for IPv6",
      def: "Network service that automatically assigns IPv6 addresses and configuration.",
      example: "DHCPv6 distributes IPv6 addresses and DNS servers to network devices.",
    },
    vi: {
      title: "Giao thức cấu hình host động cho IPv6",
      def: "Dịch vụ mạng tự động gán địa chỉ IPv6 và cấu hình.",
      example: "DHCPv6 phân phối địa chỉ IPv6 và máy chủ DNS cho thiết bị mạng.",
    },
    tags: ["network"],
  },
  {
    id: "ipv6",
    abbr: "IPv6",
    en: {
      title: "Internet Protocol version 6",
      def: "Latest version of Internet Protocol with 128-bit addresses for expanded address space.",
      example: "IPv6 address: 2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    },
    vi: {
      title: "Giao thức Internet phiên bản 6",
      def: "Phiên bản mới nhất của giao thức Internet với địa chỉ 128-bit cho không gian địa chỉ mở rộng.",
      example: "Địa chỉ IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    },
    tags: ["network"],
  },
  {
    id: "ssl",
    abbr: "SSL",
    en: {
      title: "Secure Sockets Layer",
      def: "Deprecated cryptographic protocol for secure communication, replaced by TLS.",
      example: "SSL certificates enable HTTPS connections for secure web browsing.",
    },
    vi: {
      title: "Lớp socket an toàn",
      def: "Giao thức mật mã đã lỗi thời cho giao tiếp an toàn, được thay thế bởi TLS.",
      example: "Chứng chỉ SSL cho phép kết nối HTTPS để duyệt web an toàn.",
    },
    tags: ["security", "web"],
  },
  {
    id: "tls",
    abbr: "TLS",
    en: {
      title: "Transport Layer Security",
      def: "Cryptographic protocol providing secure communication over computer networks.",
      example: "TLS 1.3 encrypts HTTPS traffic between browsers and web servers.",
    },
    vi: {
      title: "Bảo mật tầng vận chuyển",
      def: "Giao thức mật mã cung cấp giao tiếp an toàn qua mạng máy tính.",
      example: "TLS 1.3 mã hóa lưu lượng HTTPS giữa trình duyệt và máy chủ web.",
    },
    tags: ["security", "web"],
  },
  {
    id: "waf",
    abbr: "WAF",
    en: {
      title: "Web Application Firewall",
      def: "Security system that filters and monitors HTTP traffic to web applications.",
      example: "WAF blocks SQL injection and XSS attacks on web applications.",
    },
    vi: {
      title: "Tường lửa ứng dụng web",
      def: "Hệ thống bảo mật lọc và giám sát lưu lượng HTTP đến ứng dụng web.",
      example: "WAF chặn tấn công SQL injection và XSS trên ứng dụng web.",
    },
    tags: ["security", "web"],
  },
  {
    id: "siem",
    abbr: "SIEM",
    en: {
      title: "Security Information and Event Management",
      def: "Security management approach combining security information and event management.",
      example: "SIEM systems collect and analyze security logs from multiple sources.",
    },
    vi: {
      title: "Quản lý thông tin và sự kiện bảo mật",
      def: "Phương pháp quản lý bảo mật kết hợp thông tin bảo mật và quản lý sự kiện.",
      example: "Hệ thống SIEM thu thập và phân tích log bảo mật từ nhiều nguồn.",
    },
    tags: ["security"],
  },
  {
    id: "soc",
    abbr: "SOC",
    en: {
      title: "Security Operations Center",
      def: "Centralized facility for monitoring, detecting, and responding to security threats.",
      example: "SOC analysts monitor network traffic 24/7 for cyber threats.",
    },
    vi: {
      title: "Trung tâm vận hành bảo mật",
      def: "Cơ sở tập trung để giám sát, phát hiện và ứng phó với các mối đe dọa bảo mật.",
      example: "Chuyên viên SOC giám sát lưu lượng mạng 24/7 tìm mối đe dọa mạng.",
    },
    tags: ["security"],
  },
  {
    id: "osi",
    abbr: "OSI",
    en: {
      title: "Open Systems Interconnection",
      def: "Seven-layer model describing network communication protocols and functions.",
      example: "OSI layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.",
    },
    vi: {
      title: "Kết nối hệ thống mở",
      def: "Mô hình bảy tầng mô tả các giao thức và chức năng giao tiếp mạng.",
      example: "Các tầng OSI: Vật lý, Liên kết dữ liệu, Mạng, Vận chuyển, Phiên, Trình bày, Ứng dụng.",
    },
    tags: ["network"],
  },
  {
    id: "tcpip",
    abbr: "TCP/IP",
    en: {
      title: "Transmission Control Protocol / Internet Protocol",
      def: "Suite of communication protocols used for interconnecting network devices.",
      example: "TCP/IP is the foundation protocol suite of the modern Internet.",
    },
    vi: {
      title: "Giao thức điều khiển truyền / Giao thức Internet",
      def: "Bộ giao thức giao tiếp dùng để kết nối các thiết bị mạng.",
      example: "TCP/IP là bộ giao thức nền tảng của Internet hiện đại.",
    },
    tags: ["network"],
  },
  {
    id: "ftps",
    abbr: "FTPS",
    en: {
      title: "File Transfer Protocol Secure",
      def: "Extension of FTP that adds support for TLS and SSL cryptographic protocols.",
      example: "FTPS encrypts file transfers using SSL/TLS for secure data transmission.",
    },
    vi: {
      title: "Giao thức truyền file an toàn",
      def: "Phần mở rộng của FTP thêm hỗ trợ cho các giao thức mật mã TLS và SSL.",
      example: "FTPS mã hóa truyền file dùng SSL/TLS để truyền dữ liệu an toàn.",
    },
    tags: ["network", "security"],
  },
  {
    id: "smtp",
    abbr: "SMTP",
    en: {
      title: "Simple Mail Transfer Protocol",
      def: "Internet standard for email transmission between mail servers.",
      example: "Email clients use SMTP to send messages through mail servers.",
    },
    vi: {
      title: "Giao thức truyền thư đơn giản",
      def: "Tiêu chuẩn Internet cho truyền email giữa các máy chủ thư.",
      example: "Ứng dụng email dùng SMTP để gửi tin nhắn qua máy chủ thư.",
    },
    tags: ["network", "email"],
  },
  {
    id: "imap",
    abbr: "IMAP",
    en: {
      title: "Internet Message Access Protocol",
      def: "Protocol for accessing and managing email messages stored on a mail server.",
      example: "IMAP allows multiple devices to sync the same email account.",
    },
    vi: {
      title: "Giao thức truy cập thông điệp Internet",
      def: "Giao thức truy cập và quản lý email được lưu trên máy chủ thư.",
      example: "IMAP cho phép nhiều thiết bị đồng bộ cùng một tài khoản email.",
    },
    tags: ["network", "email"],
  },
  {
    id: "pop3",
    abbr: "POP3",
    en: {
      title: "Post Office Protocol v3",
      def: "Protocol for retrieving email from a mail server to a local email client.",
      example: "POP3 downloads emails to local storage and typically removes them from server.",
    },
    vi: {
      title: "Giao thức bưu điện phiên bản 3",
      def: "Giao thức lấy email từ máy chủ thư về ứng dụng email cục bộ.",
      example: "POP3 tải email về lưu trữ cục bộ và thường xóa khỏi máy chủ.",
    },
    tags: ["network", "email"],
  },
  {
    id: "json",
    abbr: "JSON",
    en: {
      title: "JavaScript Object Notation",
      def: "Lightweight data interchange format that is easy for humans to read and write.",
      example: "REST APIs commonly use JSON format for request and response data.",
    },
    vi: {
      title: "Ký hiệu đối tượng JavaScript",
      def: "Định dạng trao đổi dữ liệu nhẹ, dễ đọc và viết cho con người.",
      example: "API REST thường dùng định dạng JSON cho dữ liệu request và response.",
    },
    tags: ["data", "web"],
  },
  {
    id: "xml",
    abbr: "XML",
    en: {
      title: "eXtensible Markup Language",
      def: "Markup language for encoding documents in human and machine-readable format.",
      example: "XML is used for configuration files, web services, and data exchange.",
    },
    vi: {
      title: "Ngôn ngữ đánh dấu mở rộng",
      def: "Ngôn ngữ đánh dấu để mã hóa tài liệu ở định dạng con người và máy đọc được.",
      example: "XML được dùng cho file cấu hình, web service và trao đổi dữ liệu.",
    },
    tags: ["data", "web"],
  },
  {
    id: "yaml",
    abbr: "YAML",
    en: {
      title: "YAML Ain't Markup Language",
      def: "Human-readable data serialization standard often used for configuration files.",
      example: "Docker Compose and Kubernetes use YAML for configuration files.",
    },
    vi: {
      title: "YAML không phải ngôn ngữ đánh dấu",
      def: "Tiêu chuẩn tuần tự hóa dữ liệu con người đọc được, thường dùng cho file cấu hình.",
      example: "Docker Compose và Kubernetes dùng YAML cho file cấu hình.",
    },
    tags: ["data", "configuration"],
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
      className="w-full text-left rounded-xl border p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 border-gray-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      aria-label={`View details for ${t.abbr}: ${t.en?.title}`}
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <StickyHeader appState={appState} tab={tab} setTab={setTab} />
      
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="mt-6">
          {tab === "glossary" && <Glossary appState={appState} />}
          {tab === "converters" && <Converters />}
        </div>
        
        <AppFooter terms={appState.terms} />
      </div>
    </div>
  );
}

// Add missing hooks before existing functions
function useAppState() {
  const [terms, setTerms] = useState(() => {
    let saved = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {}
    // Merge saved terms with seedTerms (saved overrides by id; include new seeds)
    const byId = new Map(Array.isArray(saved) ? saved.map(t => [t.id, t]) : []);
    const merged = [
      ...seedTerms.map(s => byId.get(s.id) || s),
      ...saved.filter(t => !seedTerms.some(s => s.id === t.id)),
    ];
    return merged;
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

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('bluwiki.fontSize');
    return saved || 'medium';
  });

  // Handle font size persistence and apply to document
  useEffect(() => {
    localStorage.setItem('bluwiki.fontSize', fontSize);
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    const sizeClass = {
      'small': 'text-sm',
      'medium': 'text-base', 
      'large': 'text-lg',
      'extra-large': 'text-xl'
    }[fontSize];
    document.documentElement.classList.add(sizeClass);
  }, [fontSize]);

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 ${isPrintMode ? 'print-mode' : ''}`}>
      <Header appState={appState} />
      <main id="main-content" className="container mx-auto px-4 py-8" role="main">
        <Glossary appState={appState} />
      </main>
      <Footer terms={terms} />
      {showCommandPalette && <CommandPalette appState={appState} />}
      {selectedTerm && <TermModal appState={appState} />}
      {isAddingTerm && <AddTermModal appState={appState} />}
      
      {/* Accessibility Controls */}
      <div className="fixed top-4 right-16 z-50 flex gap-2">
        {/* Font Size Control */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-600 p-2">
          <label htmlFor="font-size-select" className="sr-only">Font size</label>
          <select
            id="font-size-select"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="text-xs px-2 py-1 rounded border-0 bg-transparent text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="Change font size"
          >
            <option value="small">A</option>
            <option value="medium">A</option>
            <option value="large">A</option>
            <option value="extra-large">A</option>
          </select>
        </div>
      </div>
      
      {/* Fixed Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 z-50 p-3 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-full shadow-lg border border-gray-200 dark:border-zinc-600 transition-all duration-300 hover:scale-110 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        title="Toggle Dark Mode"
        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
      
      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:ring-2 focus:ring-blue-300 focus:outline-none"
          aria-label="Back to top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Header component
function Header({ appState }) {
  const { searchQuery, setSearchQuery, exportData, importData, setShowCommandPalette, isPrintMode, setIsPrintMode, isDarkMode, toggleDarkMode } = appState;

  return (
    <>
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
      
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-800 shadow-sm border-b border-gray-200 dark:border-zinc-700" role="banner">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">BluWiki</h1>
            
            <div className="flex-1 max-w-md">
              <label htmlFor="search-input" className="sr-only">Search terms</label>
              <input
                id="search-input"
                type="search"
                placeholder="Search terms... (Press / to focus)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Smooth scroll to results when searching
                  if (e.target.value.trim()) {
                    setTimeout(() => {
                      const termsGrid = document.querySelector('.grid.gap-4.md\\:grid-cols-2.lg\\:grid-cols-3');
                      if (termsGrid) {
                        termsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="search-help"
              />
              <div id="search-help" className="sr-only">Search through all terms by abbreviation, title, or definition</div>
            </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
              title="Command Palette (Ctrl/⌘+K)"
              aria-label="Open command palette"
            >
              ⌘K
            </button>
            
            <button
              onClick={() => setIsPrintMode(!isPrintMode)}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
              title="Toggle Print Mode"
              aria-label={`${isPrintMode ? 'Exit' : 'Enter'} print mode`}
            >
              🖨️
            </button>
            
            <button
              onClick={exportData}
              className="px-3 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors focus:ring-2 focus:ring-blue-300 focus:outline-none"
              title="Export Data"
              aria-label="Export all terms as JSON file"
            >
              Export
            </button>
            
            <label className="px-3 py-2 text-sm bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 rounded-lg transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-green-300">
              Import
              <input 
                type="file" 
                accept=".json" 
                onChange={importData} 
                className="hidden" 
                aria-label="Import terms from JSON file"
              />
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

  // Multi-select tags state
  const [activeTags, setActiveTags] = useState([]);

  // Generate consistent colors for tags
  const getTagColor = (tag) => {
    const colors = [
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',
      'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700',
      'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700',
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
    ];
    const hash = tag.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Toggle tag selection
  const toggleTag = (tag) => {
    setActiveTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Filter terms by selected tags
  const filteredTermsWithTags = useMemo(() => {
    if (activeTags.length === 0) {
      return filteredTerms;
    }
    return filteredTerms.filter(term => 
      activeTags.every(tag => term.tags?.includes(tag))
    );
  }, [filteredTerms, activeTags]);

  // Local UI state for large-list UX
  const [viewMode, setViewMode] = useState('infinite'); // 'infinite' | 'pagination' | 'virtualized'
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(24);
  const [visibleCount, setVisibleCount] = useState(48); // for infinite mode
  const [alpha, setAlpha] = useState('All'); // 'All' | 'A'..'Z' | '#'
  const [sortBy, setSortBy] = useState('abbr'); // 'abbr' | 'en' | 'vi'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const sentinelRef = useRef(null);
  const parentRef = useRef(null);

  // Derive working terms with alpha filter and sorting
  const workingTerms = useMemo(() => {
    // Alpha filter helper
    const passesAlpha = (t) => {
      if (alpha === 'All') return true;
      const raw = (t.abbr || t.en?.title || t.vi?.title || '').trim();
      const first = raw.charAt(0).toUpperCase();
      if (alpha === '#') {
        return !(/[A-Z]/.test(first));
      }
      return first === alpha;
    };

    // Sort key helper
    const getKey = (t) => {
      if (sortBy === 'abbr') return (t.abbr || '').toLowerCase();
      if (sortBy === 'en') return (t.en?.title || '').toLowerCase();
      if (sortBy === 'vi') return (t.vi?.title || '').toLowerCase();
      return (t.abbr || '').toLowerCase();
    };

    const items = filteredTermsWithTags.filter(passesAlpha).slice().sort((a, b) => {
      const ka = getKey(a);
      const kb = getKey(b);
      if (ka < kb) return sortDir === 'asc' ? -1 : 1;
      if (ka > kb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [filteredTermsWithTags, alpha, sortBy, sortDir]);

  // Virtualization setup for large lists <mcreference link="https://borstch.com/blog/development/comparing-tanstack-virtual-with-react-window-which-one-should-you-choose" index="1">1</mcreference>
  const virtualizer = useVirtualizer({
    count: workingTerms?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated height of each TermCard
    overscan: 5, // Render 5 extra items outside viewport for smooth scrolling
  });

  // Reset pagination/infinite scrolling when query, tag, alpha change
  useEffect(() => {
    setPage(0);
    setVisibleCount(48);
  }, [searchQuery, activeTags, alpha]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (viewMode !== 'infinite') return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && visibleCount < workingTerms.length && !isLoadingMore) {
          setIsLoadingMore(true);
          // Simulate loading delay for better UX
          setTimeout(() => {
            setVisibleCount((n) => Math.min(n + pageSize, workingTerms.length));
            setIsLoadingMore(false);
          }, 300);
        }
      }
    }, { root: null, rootMargin: '200px 0px', threshold: 0 });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, pageSize, workingTerms.length]);

  const total = workingTerms.length;

  // Keyboard shortcuts for pagination
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts when not in input/textarea and in pagination mode
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || viewMode !== 'pagination') return;
      
      if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setPage((p) => Math.max(0, p - 1));
      } else if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const maxPage = Math.ceil(total / pageSize) - 1;
        setPage((p) => Math.min(maxPage, p + 1));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, total, pageSize]);
  const showing = viewMode === 'infinite' ? Math.min(visibleCount, total) : Math.min(total, pageSize);

  // Compute items to render based on mode
  const itemsToRender = useMemo(() => {
    if (viewMode === 'infinite') {
      return workingTerms.slice(0, visibleCount);
    } else {
      const start = page * pageSize;
      return workingTerms.slice(start, start + pageSize);
    }
  }, [viewMode, workingTerms, visibleCount, page, pageSize]);

  if (filteredTermsWithTags.length === 0 && (searchQuery.trim() || activeTags.length > 0)) {
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

  const letters = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#'];

  return (
    <div className="space-y-6">
      {/* Controls Row */}
      <div className="flex flex-col gap-3">
        {/* Counts + Modes */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {itemsToRender.length} of {total} result{total !== 1 ? 's' : ''}
            {activeTag && (
              <span className="ml-2">in tag <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded">{activeTag}</span></span>
            )}
            {searchQuery && (
              <span className="ml-2">for "{searchQuery}"</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode */}
            <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
              <button
                onClick={() => setViewMode('infinite')}
                className={`px-3 py-1.5 text-sm ${viewMode === 'infinite' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300'}`}
              >
                Infinite
              </button>
              <button
                onClick={() => setViewMode('pagination')}
                className={`px-3 py-1.5 text-sm ${viewMode === 'pagination' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300'}`}
              >
                Pages
              </button>
              <button
                onClick={() => setViewMode('virtualized')}
                className={`px-3 py-1.5 text-sm ${viewMode === 'virtualized' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300'}`}
              >
                Virtual
              </button>
            </div>

            {/* Page size */}
            <label className="text-sm text-gray-600 dark:text-gray-400">Page size</label>
            <select
              value={pageSize}
              onChange={(e) => { const n = parseInt(e.target.value, 10); setPageSize(n); setVisibleCount(Math.max(48, n)); setPage(0); }}
              className="text-sm px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200"
            >
              {[12, 24, 36, 48, 60, 96].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            {/* Sorting */}
            <label className="text-sm text-gray-600 dark:text-gray-400">Sort</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200"
            >
              <option value="abbr">Abbreviation</option>
              <option value="en">English title</option>
              <option value="vi">Vietnamese title</option>
            </select>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value)}
              className="text-sm px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>

        {/* Alpha Navigation */}
        <div className="flex flex-wrap gap-1">
          {letters.map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setAlpha(ch);
                // Smooth scroll to terms grid after filter change
                setTimeout(() => {
                  const termsGrid = document.querySelector('.grid.gap-4.md\\:grid-cols-2.lg\\:grid-cols-3');
                  if (termsGrid) {
                    termsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className={`px-2 py-1 text-xs rounded ${alpha === ch ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600'}`}
            >
              {ch}
            </button>
          ))}
        </div>

        {/* Tag Filter - Multi-select Chips */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags:</span>
              {activeTags.length > 0 && (
                <button
                  onClick={() => setActiveTags([])}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Clear all ({activeTags.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => {
                const isSelected = activeTags.includes(tag);
                const colorClasses = getTagColor(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition-all duration-200 ${
                      isSelected 
                        ? `${colorClasses} ring-2 ring-blue-500 ring-opacity-50 shadow-md transform scale-105` 
                        : `${colorClasses} hover:shadow-md hover:scale-105 opacity-70 hover:opacity-100`
                    }`}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Terms Grid */}
      {viewMode === 'virtualized' ? (
        <div
          ref={parentRef}
          className="h-[600px] overflow-auto border border-gray-200 dark:border-zinc-700 rounded-lg"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const term = workingTerms[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="p-2">
                    <TermCard
                      term={term}
                      onClick={() => {
                        setSelectedTerm(term);
                        window.location.hash = term.id;
                      }}
                      onTagClick={(tag) => toggleTag(tag)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {itemsToRender.map(term => (
            <TermCard
              key={term.id}
              term={term}
              onClick={() => {
                setSelectedTerm(term);
                window.location.hash = term.id;
              }}
              onTagClick={(tag) => toggleTag(tag)}
            />
          ))}
          {/* Show skeleton cards when loading more */}
          {isLoadingMore && viewMode === 'infinite' && (
            Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} />
            ))
          )}
        </div>
      )}

      {/* Load more / sentinel for infinite */}
      {viewMode === 'infinite' && (
        <div className="flex items-center justify-center">
          {visibleCount < total ? (
            <>
              <button
                onClick={() => setVisibleCount((n) => Math.min(n + pageSize, total))}
                className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-zinc-600"
              >
                Load more
              </button>
              <div ref={sentinelRef} className="h-8 w-full opacity-0" />
            </>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400">End of results</div>
          )}
        </div>
      )}

      {/* Virtualized mode info */}
      {viewMode === 'virtualized' && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Showing all {total} items with virtualization for optimal performance <mcreference link="https://borstch.com/blog/development/comparing-tanstack-virtual-with-react-window-which-one-should-you-choose" index="1">1</mcreference>
        </div>
      )}

      {/* Pagination Controls */}
      {viewMode === 'pagination' && total > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm rounded bg-gray-200 dark:bg-zinc-700 disabled:opacity-50 text-gray-800 dark:text-gray-200"
            >
              Prev
            </button>
            {(() => {
              const pageCount = Math.ceil(total / pageSize);
              const maxButtons = 7;
              let start = Math.max(0, page - Math.floor(maxButtons / 2));
              let end = Math.min(pageCount - 1, start + maxButtons - 1);
              start = Math.max(0, end - maxButtons + 1);
              const btns = [];
              for (let i = start; i <= end; i++) {
                btns.push(
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`px-3 py-1.5 text-sm rounded ${i === page ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200'}`}
                  >
                    {i + 1}
                  </button>
                );
              }
              return btns;
            })()}
            <button
              onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize) - 1, p + 1))}
              disabled={page >= Math.ceil(total / pageSize) - 1}
              className="px-3 py-1.5 text-sm rounded bg-gray-200 dark:bg-zinc-700 disabled:opacity-50 text-gray-800 dark:text-gray-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Term Card component
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 animate-pulse">
      <div className="mb-2">
        <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-16 mb-2"></div>
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-2/3"></div>
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded"></div>
        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded"></div>
        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-5/6"></div>
      </div>
      <div className="flex flex-wrap gap-1">
        <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-12"></div>
        <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-16"></div>
      </div>
    </div>
  );
}

function TermCard({ term, onClick, onTagClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const definition = term.en?.def || term.definition;
  const isLongDefinition = definition && definition.length > 120;
  
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
      
      <div className="text-gray-700 dark:text-gray-300 text-sm mb-3">
        <p className={isLongDefinition && !isExpanded ? 'line-clamp-3' : ''}>
          {definition}
        </p>
        {isLongDefinition && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-blue-600 dark:text-blue-400 text-xs mt-1 hover:underline focus:outline-none"
          >
            {isExpanded ? 'Ẩn bớt' : 'Hiển thị thêm'}
          </button>
        )}
      </div>
      
      {term.tags && term.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {term.tags.map(tag => {
            // Generate consistent colors for tags
            const colors = [
              'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
              'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
              'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
              'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
              'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',
              'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700',
              'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700',
              'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
            ];
            const hash = tag.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0);
            const colorClasses = colors[Math.abs(hash) % colors.length];
            
            return (
              <span
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag);
                }}
                className={`px-2 py-1 text-xs rounded border cursor-pointer transition-all duration-200 hover:shadow-sm hover:scale-105 ${colorClasses}`}
              >
                {tag}
              </span>
            );
          })}
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
  
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  
  // Focus management
  useEffect(() => {
    if (selectedTerm && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [selectedTerm]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedTerm(null);
      }
    };
    
    if (selectedTerm) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedTerm, setSelectedTerm]);

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
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && setSelectedTerm(null)}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {isEditing ? (
                <input
                  value={editForm.abbr}
                  onChange={(e) => setEditForm(prev => ({ ...prev, abbr: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Abbreviation"
                  aria-label="Term abbreviation"
                />
              ) : (
                <h2 id="modal-title" className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedTerm.abbr}</h2>
              )}
            </div>
            <button
              ref={closeButtonRef}
              onClick={() => setSelectedTerm(null)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl ml-4 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded"
              aria-label="Close modal"
            >
              <span aria-hidden="true">×</span>
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="English title"
                    aria-label="English title"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg h-24 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="English definition"
                    aria-label="English definition"
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
