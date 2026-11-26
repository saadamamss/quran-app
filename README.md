# تطبيق المصحف الرقمي | Digital Quran App 📖

**🌐 رابط المعاينة المباشرة | Live Demo: [quran-app-inky.vercel.app](https://quran-app-inky.vercel.app/)**

تطبيق ويب حديث ومتطور لعرض المصحف الشريف (برواية حفص) بتجربة قراءة تفاعلية فريدة، يجمع بين جمال التصميم الورقي التقليدي وسهولة التقنيات الرقمية الحديثة.

A modern web application for displaying the Holy Quran (Hafs recitation) with a unique interactive reading experience, combining the beauty of traditional paper design with the ease of modern digital technologies.

---

## ✨ المميزات الرئيسية | Key Features

- **📖 تجربة قراءة واقعية**: محاكاة كاملة لمصحف المدينة المنورة مع استخدام خطوط عثمانية عالية الجودة لكل صفحة.
- **🔊 تلاوة صوتية تفاعلية**: استماع لآيات القرآن الكريم بأصوات مشاهير القراء (المنشاوي، العفاسي، الحصري، وغيرهم).
- **🔁 تشغيل مستمر**: خاصية القراءة المتواصلة مع تقليب الصفحات تلقائياً لمتابعة القارئ.
- **📚 التفسير والترجمة**: عرض التفسير الميسر والترجمة الإنجليزية لكل آية بشكل فوري.
- **🔍 محرك بحث ذكي**: ابحث عن السور، الآيات، أو أرقام الصفحات والوصول إليها بلمحة بصر.
- **🌙 الوضع الليلي (Dark Mode)**: قراءة مريحة للعين في ظروف الإضاءة الضعيفة.
- **💾 حفظ الحالة (Persistence)**: التطبيق يتذكر آخر صفحة قرأتها، القارئ المفضل، ووضع الرؤية الخاص بك تلقائياً.
- **📱 تطبيق ويب تقدمي (PWA)**: إمكانية تثبيت التطبيق على الهاتف والعمل بدون إنترنت (Offline Support).
- **🔖 العلامات المرجعية**: حفظ الآيات الهامة للعودة إليها لاحقاً بسهولة.

---

## 🚀 التقنيات المستخدمة | Tech Stack

- **Framework**: [Vue.js 3](https://vuejs.org/) (Composition API)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Slider/Navigation**: [Swiper.js](https://swiperjs.com/)
- **Persistence**: Manual LocalStorage Management
- **API**: [Alquran.cloud](https://alquran.cloud/api) & [Quran.com API](https://quran.com/developers)
- **PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)

---

## 🛠️ طريقة التشغيل | Installation & Setup

لشغيل المشروع محلياً على جهازك، اتبع الخطوات التالية:

1.  **استنساخ المستودع (Clone the repo)**:

    ```bash
    git clone https://github.com/your-username/quran-app.git
    cd quran-app
    ```

2.  **تثبيت المكتبات (Install dependencies)**:

    ```bash
    npm install
    ```

3.  **بدء التشغيل (Development mode)**:

    ```bash
    npm run dev
    ```

4.  **بناء نسخة الإنتاج (Build for production)**:
    ```bash
    npm run build
    ```

---

## 📚 Documentation | التوثيق

Detailed engineering documentation lives in [`docs/`](./docs/README.md):

- [Project status](./docs/STATUS.md) — what works, metrics, build health
- [Architecture](./docs/ARCHITECTURE.md) — rendering pipeline, audio, state
- [File reference](./docs/FILES.md) — purpose of every file
- [APIs & data](./docs/API_AND_DATA.md) — endpoints, schemas, persistence
- [Issues & roadmap](./docs/ISSUES.md) — bugs, debt, prioritized plan
- [Developer guide](./docs/DEV_GUIDE.md) — setup, recipes, troubleshooting
- [Page data pipeline](./docs/PAGE_DATA_PIPELINE.md) — generated 604-page local dataset

---

## 📄 الترخيص | License

هذا المشروع متاح تحت رخصة MIT.

---

**تم التطوير بكل ❤️ لخدمة كتاب الله.**
**Developed with ❤️ for the service of the Holy Quran.**
