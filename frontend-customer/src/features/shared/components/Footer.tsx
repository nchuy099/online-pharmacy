import React from "react";
import { FaPills, FaFacebook, FaYoutube, FaTiktok, FaPhone, FaEnvelope, FaLocationDot, FaChevronRight } from "react-icons/fa6";

export const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-100 pt-20 pb-10 overflow-hidden relative">
            {/* Subtle decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-40 translate-x-32 -translate-y-32 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    {/* Brand Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                                <FaPills className="text-white text-xl" />
                            </div>
                            <span className="font-black text-2xl text-gray-900 tracking-tight">SmartPharma</span>
                        </div>
                        <p className="text-gray-500 leading-relaxed font-medium">
                            Chăm sóc sức khỏe gia đình Việt bằng sự tận tâm, chuyên nghiệp và uy tín từ đội ngũ dược sĩ hàng đầu.
                        </p>
                        <div className="flex gap-4">
                            <SocialIcon icon={<FaFacebook />} />
                            <SocialIcon icon={<FaYoutube />} />
                            <SocialIcon icon={<FaTiktok />} />
                        </div>
                    </div>

                    {/* Links 1 */}
                    <div>
                        <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-8">Về SmartPharma</h3>
                        <ul className="space-y-4">
                            <FooterLink label="Giới thiệu hệ thống" />
                            <FooterLink label="Hệ thống nhà thuốc" />
                            <FooterLink label="Hướng dẫn mua hàng" />
                            <FooterLink label="Tin tức & Sự kiện" />
                        </ul>
                    </div>

                    {/* Links 2 */}
                    <div>
                        <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-8">Chính sách chung</h3>
                        <ul className="space-y-4">
                            <FooterLink label="Chính sách đổi trả" />
                            <FooterLink label="Chính sách bảo mật" />
                            <FooterLink label="Điều khoản sử dụng" />
                            <FooterLink label="Vận chuyển & Thanh toán" />
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-8">Liên hệ hỗ trợ</h3>
                        <div className="space-y-6">
                            <ContactItem icon={<FaPhone />} title="Hotline 24/7" value="1900 1234" />
                            <ContactItem icon={<FaEnvelope />} title="Email hỗ trợ" value="hotro@smartpharma.vn" />
                            <ContactItem icon={<FaLocationDot />} title="Văn phòng" value="123 Đường ABC, Quận 1, Tp. HCM" />
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">
                        © 2024 SmartPharma • Health is Wealth
                    </p>
                    <div className="flex items-center gap-6 filter grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        <img src="https://pharmacity.vn/images/identity-verified.png" alt="Bo Cong Thuong" className="h-8" />
                    </div>
                </div>
            </div>
        </footer>
    );
};

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => (
    <a href="#" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white hover:scale-110 transition-all duration-300">
        {icon}
    </a>
);

const FooterLink = ({ label }: { label: string }) => (
    <li>
        <a href="#" className="text-gray-500 hover:text-emerald-600 font-bold text-[14px] transition-all duration-200 flex items-center gap-2 group">
            <FaChevronRight className="text-[10px] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            {label}
        </a>
    </li>
);

const ContactItem = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) => (
    <div className="flex items-start gap-4">
        <div className="mt-1 text-emerald-600 bg-emerald-50 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
            <p className="text-sm font-black text-gray-900">{value}</p>
        </div>
    </div>
);
