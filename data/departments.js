'use strict';

const ATLAS_DEPARTMENTS = [
  { name: 'Bilgisayar Mühendisliği', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi' },
  { name: 'Bilgisayar Mühendisliği (İngilizce)', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi' },

  { name: 'Tıp', faculty: 'Tıp Fakültesi' },
  { name: 'Tıp (İngilizce)', faculty: 'Tıp Fakültesi' },

  { name: 'Diş Hekimliği', faculty: 'Diş Hekimliği Fakültesi' },
  { name: 'Diş Hekimliği (İngilizce)', faculty: 'Diş Hekimliği Fakültesi' },

  { name: 'Beslenme ve Diyetetik', faculty: 'Sağlık Bilimleri Fakültesi' },
  { name: 'Dil ve Konuşma Terapisi', faculty: 'Sağlık Bilimleri Fakültesi' },
  { name: 'Dil ve Konuşma Terapisi (İngilizce)', faculty: 'Sağlık Bilimleri Fakültesi' },
  { name: 'Ebelik', faculty: 'Sağlık Bilimleri Fakültesi' },
  { name: 'Ergoterapi', faculty: 'Sağlık Bilimleri Fakültesi' },
  { name: 'Hemşirelik', faculty: 'Sağlık Bilimleri Fakültesi' },
  { name: 'Hemşirelik (İngilizce)', faculty: 'Sağlık Bilimleri Fakültesi' },
  { name: 'Fizyoterapi ve Rehabilitasyon', faculty: 'Sağlık Bilimleri Fakültesi' },
  { name: 'Fizyoterapi ve Rehabilitasyon (İngilizce)', faculty: 'Sağlık Bilimleri Fakültesi' },

  { name: 'İngilizce Mütercim ve Tercümanlık', faculty: 'İnsan ve Toplum Bilimleri Fakültesi' },
  { name: 'Psikoloji', faculty: 'İnsan ve Toplum Bilimleri Fakültesi' },
  { name: 'Psikoloji (İngilizce)', faculty: 'İnsan ve Toplum Bilimleri Fakültesi' },
  { name: 'İngiliz Dili ve Edebiyatı', faculty: 'İnsan ve Toplum Bilimleri Fakültesi' },
  { name: 'İşletme', faculty: 'İnsan ve Toplum Bilimleri Fakültesi' },
  { name: 'İşletme (İngilizce)', faculty: 'İnsan ve Toplum Bilimleri Fakültesi' },
  { name: 'Uluslararası Ticaret ve Finansman (İngilizce)', faculty: 'İnsan ve Toplum Bilimleri Fakültesi' },
  { name: 'Yönetim Bilişim Sistemleri (İngilizce)', faculty: 'İnsan ve Toplum Bilimleri Fakültesi' },

  { name: 'Endüstri Mühendisliği (İngilizce)', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi' },
  { name: 'İç Mimarlık ve Çevre Tasarımı', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi' },
  { name: 'Yazılım Mühendisliği (İngilizce)', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi' },
  { name: 'Moleküler Biyoloji ve Genetik (İngilizce)', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi' },
  { name: 'Biyomedikal Mühendisliği (İngilizce)', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi' },
  { name: 'Elektrik-Elektronik Mühendisliği (İngilizce)', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi' },
  { name: 'Veri Bilimi ve Analitiği (İngilizce)', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi' },
  { name: 'Yapay Zeka ve Veri Mühendisliği (İngilizce)', faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi' },

  { name: 'Dijital Oyun Tasarımı', faculty: 'Sanat, Tasarım ve Mimarlık Fakültesi' },
  { name: 'Endüstriyel Tasarım', faculty: 'Sanat, Tasarım ve Mimarlık Fakültesi' },
  { name: 'Görsel İletişim Tasarımı', faculty: 'Sanat, Tasarım ve Mimarlık Fakültesi' },
  { name: 'İç Mimarlık ve Çevre Tasarımı', faculty: 'Sanat, Tasarım ve Mimarlık Fakültesi' },

  { name: 'Ağız ve Diş Sağlığı', faculty: 'Meslek Yüksekokulu' },
  { name: 'Fizyoterapi', faculty: 'Meslek Yüksekokulu' },
  { name: 'Ameliyathane Hizmetleri', faculty: 'Meslek Yüksekokulu' },
  { name: 'Tıbbi Laboratuvar Teknikleri', faculty: 'Meslek Yüksekokulu' },
  { name: 'İlk ve Acil Yardım', faculty: 'Meslek Yüksekokulu' },
  { name: 'Optisyenlik', faculty: 'Meslek Yüksekokulu' },
  { name: 'Anestezi', faculty: 'Meslek Yüksekokulu' },
  { name: 'Tıbbi Tanıtım ve Pazarlama', faculty: 'Meslek Yüksekokulu' },
  { name: 'Diyaliz', faculty: 'Meslek Yüksekokulu' },
  { name: 'Dezenfeksiyon, Sterilizasyon ve Antisepsi Teknikerliği', faculty: 'Meslek Yüksekokulu' },
  { name: 'Tıbbi Görüntüleme Teknikleri', faculty: 'Meslek Yüksekokulu' },
  { name: 'Bilgisayar Programcılığı', faculty: 'Meslek Yüksekokulu' },
  { name: 'Bilişim Güvenliği Teknolojisi', faculty: 'Meslek Yüksekokulu' },
  { name: 'Grafik Tasarımı', faculty: 'Meslek Yüksekokulu' },
  { name: 'İç Mekan Tasarımı', faculty: 'Meslek Yüksekokulu' },
  { name: 'E-Ticaret ve Pazarlama', faculty: 'Meslek Yüksekokulu' },
  { name: 'Yaşlı Bakımı', faculty: 'Meslek Yüksekokulu' },
  { name: 'Lojistik', faculty: 'Meslek Yüksekokulu' },
  { name: 'Çevre Sağlığı ve Çevresel Risk Yönetimi Teknikerliği', faculty: 'Meslek Yüksekokulu' },
  { name: 'Tele-Sağlık Teknikerliği', faculty: 'Meslek Yüksekokulu' },
  { name: 'Yeşil ve Ekolojik Bina Teknikerliği', faculty: 'Meslek Yüksekokulu' },
  { name: 'Diş Protez Teknolojisi', faculty: 'Meslek Yüksekokulu' },
];

if (typeof window !== 'undefined') window.ATLAS_DEPARTMENTS = ATLAS_DEPARTMENTS;
if (typeof module !== 'undefined' && module.exports) module.exports = { ATLAS_DEPARTMENTS };
