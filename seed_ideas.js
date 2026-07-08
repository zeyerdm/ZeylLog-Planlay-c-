const http = require('http');

// CSV'den alınan 30 günlük içerik fikirleri
const ideas = [
    { text: "GÜN 1 | Vibe Coding 1 — 'Kusursuz olmasını beklemekten yoruldum. O projeye bugün başlıyorum.' | Portfolyo kodlama serisi başlıyor ✨", status: "acil" },
    { text: "GÜN 2 | Köyde Staj — 'Yazılımcı olmanın (YBS) en sevdiğim yanı stajımı böyle bir yerden yapabilmek.' 🌲💻", status: "yapilacak" },
    { text: "GÜN 3 | Kısa Hook — 'O kodun neden çalışmadığını 3 saat sonra bulduğumda yaşadığım aydınlanma...' (Debugging mizahı)", status: "yapilacak" },
    { text: "GÜN 4 | Kısa Hook — 'Sürekli yeni şeyler öğrenmek zorundaymışım hissi beni yorduğunda uyguladığım detoks...' (B-roll: kitap + doğa)", status: "yapilacak" },
    { text: "GÜN 5 | Haftalık Vlog — 'Karadeniz'de köy evinde online staj yapan bir YBS öğrencisinin haftası.' (Staj + kod + doğa yürüyüşü)", status: "yapilacak" },
    { text: "GÜN 6 | Vibe Coding 2 — 'Portfolyo sitemi yaparken her şeyin tıkır tıkır ilerleyeceğini sanmıştım... 🤡' (İzleyicilere renk paleti sorusu)", status: "yapilacak" },
    { text: "GÜN 7 | Kısa Hook — 'Sadece YBS okuyanların anlayabileceği o garip hissiyat...' (Komik klişeler + bölüm tanımı)", status: "yapilacak" },
    { text: "GÜN 8 | Kısa Hook — 'Vizelere 1 hafta kalmıştır ama benim çalışma masamı baştan dekore etme isteğim...' (Procrastination)", status: "yapilacak" },
    { text: "GÜN 9 | Köyde Staj — 'Şehirdeki o kaostan kaçıp, verilerle doğanın ortasında baş başa kalmak...' (Mental sağlık + doğa)", status: "yapilacak" },
    { text: "GÜN 10 | Kısa Hook — 'Bilgisayarın başında geçirdiğim 6 saatin sonunda boynumun benden intikam alışı.' (Masa başı zorluğu)", status: "yapilacak" },
    { text: "GÜN 11 | Vibe Coding 3 — 'Sıfırdan başladığım portfolyo sitem yavaş yavaş şuna benzemeye başladı ⬇️' (Ekran kaydı + yorum iste)", status: "yapilacak" },
    { text: "GÜN 12 | Kısa Hook — ''Notion'da tüm hayatımı renkli renkli planlarsam her şey düzelir' yanılgısı.' (Plan yapıp uymama hüznü)", status: "yapilacak" },
    { text: "GÜN 13 | Haftalık Vlog — 'Karadeniz'de stajyer olmak: Sabahları veri, akşamları oksijen çarpması.' (Sabah rutini vlogu)", status: "yapilacak" },
    { text: "GÜN 14 | Kısa Hook — 'Eğer şu an masanın başında boş boş ekrana bakıyorsan, bu video sana bir işaret.' (Mini motivasyon)", status: "yapilacak" },
    { text: "GÜN 15 | Vibe Coding 4 — 'Kodlama bilmeden önce bunun imkansız olduğunu düşünürdüm. Ve sonuç...' (Portfolyo bitişi kutlaması!)", status: "yapilacak" },
    { text: "GÜN 16 | Kısa Hook — 'Bir şeyleri başarmak için motivasyona değil, sadece disipline ihtiyacın var.' (Samimi uzun caption)", status: "yapilacak" },
    { text: "GÜN 17 | Köyde Staj — 'İki farklı hayatı aynı anda yaşıyorum ve bu çok garip hissettiriyor.' (İnekler ve MacBook zıtlığı 😅)", status: "yapilacak" },
    { text: "GÜN 18 | Kısa Hook — 'Hata vermeden çalışan ilk kodumu yazdığımda hissettiğim o tanrısal güç.' (Tatlı zafer hissi)", status: "yapilacak" },
    { text: "GÜN 19 | Kısa Hook — 'Bütün hafta hiçbir şey yapmayıp Pazar akşamı gelen o ani hayatımı düzeltmeliyim perisi.' (ASMR kahve yapımı)", status: "yapilacak" },
    { text: "GÜN 20 | Haftalık Vlog — 'Her gün mükemmel geçmiyor. Bugün stajda mental olarak çöktüğüm o anlar...' (Gerçekçilik + samimiyet)", status: "yapilacak" },
    { text: "GÜN 21 | Kısa Hook — 'Üniversite 1. sınıf Zeynep vs. Üniversite 4. sınıf Zeynep... (Nasıl bu hale geldim?)' (Değişim + olgunlaşma)", status: "yapilacak" },
    { text: "GÜN 22 | Kısa Hook — 'Mezuniyete sadece aylar kaldı ve aklımdaki tek soru şu:' (İşsizlik kaygısı — yorum artırıcı soru)", status: "yapilacak" },
    { text: "GÜN 23 | Köyde Staj — 'Sadece evden uzakta staj yaparken öğrenebileceğin 3 hayat dersi.' (Doğa yürüyüşü eşliğinde)", status: "yapilacak" },
    { text: "GÜN 24 | Yeni Seri Başlangıcı — 'Portfolyo sitemden sonra özgüvenim geldi, şimdi yeni projemize başlıyoruz!' (Vibe Coding 2. seri kancası)", status: "yapilacak" },
    { text: "GÜN 25 | Kısa Hook — '20'li yaşların başındayken sanki tüm hayatını şu an çözmek zorundaymışsın gibi hissetmek...' (Gen Z anksiyetesi — çok save alır!)", status: "yapilacak" },
    { text: "GÜN 26 | Haftalık Vlog — 'Bir aylık online köy stajım bana ne öğretti?' (Kapanış değerlendirme vlogu)", status: "yapilacak" },
    { text: "GÜN 27 | Kısa Hook — 'Yazılımcı mı olacağım, yönetici mi? YBS okuyanların bitmeyen varoluşsal sancısı.' (Klasik YBS geyiği)", status: "yapilacak" },
    { text: "GÜN 28 | Etkileşim (Q&A) — 'YBS, veri stajı veya Karadeniz'de köy hayatı hakkında bana her şeyi sorabilirsiniz 👇' (Yorum bombası)", status: "acil" },
    { text: "GÜN 29 | Kısa Hook — 'Kendimi sürekli başkalarıyla kıyaslamayı bıraktığım o an.' (Kişisel gelişim + şeffaflık)", status: "yapilacak" },
    { text: "GÜN 30 | Kutlama & Kapanış — 'Sadece 30 gün boyunca her gün üretmeye karar verdim ve hayatım böyle değişti...' (30 günlük özet + teşekkür + yeni hedef)", status: "yapilacak" },
];

function addIdea(idea, index) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ id: Date.now() + index * 10, text: idea.text, status: idea.status });
        const options = {
            hostname: '2.27.101.186',
            port: 80,
            path: '/api/ideas',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };
        const req = http.request(options, (res) => {
            console.log(`✓ GÜN ${index + 1} eklendi (${res.statusCode})`);
            resolve();
        });
        req.on('error', (e) => { console.error(`✗ Hata: ${e.message}`); resolve(); });
        req.write(data);
        req.end();
    });
}

async function seedAll() {
    for (let i = 0; i < ideas.length; i++) {
        await addIdea(ideas[i], i);
        await new Promise(r => setTimeout(r, 80));
    }
    console.log('\n✅ Tüm 30 günlük içerik fikirleri eklendi!');
}

seedAll();
