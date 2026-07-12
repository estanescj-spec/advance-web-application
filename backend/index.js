const app = require('./app');
const db = require('./models');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

async function seedDatabase() {
    try {
        await db.sequelize.sync({ alter: true });
        console.log('Database synced successfully.');

        async function ensureDefaultAccount({ name, email, password, role }) {
            const existing = await db.User.scope('withPassword').findOne({ where: { email }, paranoid: false });
            if (!existing) {
                return db.User.create({ name, email, password, role });
            }
            if (existing.deleted_at) {
                await existing.restore();
            }
            await existing.update({
                name,
                role,
                is_active: true,
                password
            });

            return existing;
        }

        const catCount = await db.Category.count();

        if (catCount === 0) {
            console.log('Seeding default categories...');

            const categories = await db.Category.bulkCreate([
                { name: 'MacBook' },
                { name: 'iPhone' },
                { name: 'iPad' },
                { name: 'Apple Watch' }
            ]);

            console.log('Seeding default products...');

            const macCat = categories.find(c => c.name === 'MacBook');
            const iphoneCat = categories.find(c => c.name === 'iPhone');
            const ipadCat = categories.find(c => c.name === 'iPad');
            const watchCat = categories.find(c => c.name === 'Apple Watch');

            // Create products and attach categories via the join table
            const productsToCreate = [
            // ===================== MacBook (4) =====================
            {
                name: 'MacBook Air 13-inch (M5)',
                description: 'The world\'s most popular laptop, now with the M5 chip for even faster everyday performance.',
                categories: [macCat.id],
                cost_price: 55000.00,
                sell_price: 61990.00,
                stock_quantity: 15,
                color: 'Sky Blue',
                storage: '256GB SSD',
                images: ['images/macbook_air_m5_13.png']
            },
            {
                name: 'MacBook Air 15-inch (M5)',
                description: 'More screen, same effortless speed. The 15-inch MacBook Air with M5 is built for work and play.',
                categories: [macCat.id],
                cost_price: 63000.00,
                sell_price: 70990.00,
                stock_quantity: 12,
                color: 'Sky Blue',
                storage: '256GB SSD',
                images: ['images/macbook_air_m5_15.png']
            },
            {
                name: 'MacBook Pro 14-inch (M5 Pro)',
                description: 'Pro-level power in a compact 14-inch chassis, with the M5 Pro chip for demanding creative workflows.',
                categories: [macCat.id],
                cost_price: 135000.00,
                sell_price: 146990.00,
                stock_quantity: 8,
                color: 'Space Black',
                storage: '1TB SSD',
                images: ['images/macbook_pro_m5_14.png']
            },
            {
                name: 'MacBook Pro 16-inch (M5 Max)',
                description: 'The ultimate MacBook Pro, with the M5 Max chip for the most demanding pro workloads.',
                categories: [macCat.id],
                cost_price: 185000.00,
                sell_price: 204990.00,
                stock_quantity: 5,
                color: 'Space Black',
                storage: '1TB SSD',
                images: ['images/macbook_pro_m5_max_16.jpg']
            },

            // ===================== iPhone (4) =====================
            {
                name: 'iPhone 17',
                description: 'Apple\'s most affordable flagship, with a larger 6.3-inch ProMotion display and the A19 chip.',
                categories: [iphoneCat.id],
                cost_price: 40000.00,
                sell_price: 46990.00,
                stock_quantity: 30,
                color: 'Sage',
                storage: '256GB',
                images: ['images/iphone17.jpg']
            },
            {
                name: 'iPhone Air',
                description: 'Apple\'s thinnest and lightest iPhone ever, with a titanium frame and all-day battery life.',
                categories: [iphoneCat.id],
                cost_price: 50000.00,
                sell_price: 57990.00,
                stock_quantity: 20,
                color: 'Cloud White',
                storage: '256GB',
                images: ['images/iphone_air.jpg']
            },
            {
                name: 'iPhone 17 Pro',
                description: 'Titanium design, the A19 Pro chip, and an upgraded Fusion camera system with 4K 120fps video.',
                categories: [iphoneCat.id],
                cost_price: 56000.00,
                sell_price: 63990.00,
                stock_quantity: 22,
                color: 'Deep Blue',
                storage: '256GB',
                images: ['images/iphone17_pro.jpg']
            },
            {
                name: 'iPhone 17e',
                description: 'The most affordable member of the iPhone 17 family, with the A19 chip and double the starting storage.',
                categories: [iphoneCat.id],
                cost_price: 30000.00,
                sell_price: 34990.00,
                stock_quantity: 25,
                color: 'Black',
                storage: '256GB',
                images: ['images/iphone17e.jpg']
            },

            // ===================== iPad (4) =====================
            {
                name: 'iPad (A16)',
                description: 'The essential iPad experience, now with the A16 chip for smooth everyday performance.',
                categories: [ipadCat.id],
                cost_price: 24000.00,
                sell_price: 27990.00,
                stock_quantity: 20,
                color: 'Pink',
                storage: '128GB',
                images: ['images/ipad_a16.webp']
            },
            {
                name: 'iPad mini (A17 Pro)',
                description: 'Powerful, portable, and totally redesigned with the A17 Pro chip and Apple Intelligence support.',
                categories: [ipadCat.id],
                cost_price: 30000.00,
                sell_price: 34990.00,
                stock_quantity: 15,
                color: 'Starlight',
                storage: '128GB',
                images: ['images/ipad_mini_a17_pro.webp']
            },
            {
                name: 'iPad Air (M4)',
                description: 'Serious performance in a thin and light design, powered by the M4 chip with faster connectivity.',
                categories: [ipadCat.id],
                cost_price: 42000.00,
                sell_price: 47990.00,
                stock_quantity: 14,
                color: 'Blue',
                storage: '128GB',
                images: ['images/ipad_air_m4.webp']
            },
            {
                name: 'iPad Pro 13-inch (M5)',
                description: 'Impossibly thin design with outrageous performance and the breakthrough Ultra Retina XDR display.',
                categories: [ipadCat.id],
                cost_price: 75000.00,
                sell_price: 82990.00,
                stock_quantity: 8,
                color: 'Black',
                storage: '512GB',
                images: ['images/ipad_pro_m5_13.webp']
            },
            // ===================== Apple Watch (5) =====================
            {
                name: 'Apple Watch Series 11',
                description: 'The most advanced Apple Watch yet, with all-day battery life and advanced health sensors.',
                categories: [watchCat.id],
                cost_price: 18000.00,
                sell_price: 21990.00,
                stock_quantity: 25,
                color: 'Jet Black',
                images: ['images/apple_watch_series_11.jpg']
            },
            {
                name: 'Apple Watch SE 3',
                description: 'The essential Apple Watch experience at a more affordable price, now faster and more capable.',
                categories: [watchCat.id],
                cost_price: 12000.00,
                sell_price: 14990.00,
                stock_quantity: 30,
                color: 'Starlight',
                images: ['images/apple_watch_se_3.jpg']
            },
            {
                name: 'Apple Watch Ultra 3',
                description: 'The most rugged and capable Apple Watch, built for endurance athletes and outdoor adventurers.',
                categories: [watchCat.id],
                cost_price: 35000.00,
                sell_price: 41990.00,
                stock_quantity: 12,
                color: 'Natural Titanium',
                images: ['images/apple_watch_ultra_3.jpg']
            },
            {
                name: 'Apple Watch Hermès Series 11',
                description: 'Apple Watch Series 11 paired with an exclusive Hermès band and watch face designs.',
                categories: [watchCat.id],
                cost_price: 32000.00,
                sell_price: 37990.00,
                stock_quantity: 6,
                color: 'Ébène',
                images: ['images/apple_watch_hermes_series_11.jpg']
            },
            {
                name: 'Apple Watch Hermès Ultra 3',
                description: 'The Ultra 3 rugged design meets Hermès craftsmanship in this limited premium collaboration.',
                categories: [watchCat.id],
                cost_price: 48000.00,
                sell_price: 55990.00,
                stock_quantity: 4,
                color: 'Natural Titanium',
                images: ['images/apple_watch_hermes_ultra_3.jpg']
            }
        ];

            for (const p of productsToCreate) {
                const { categories, ...prodData } = p;
                const created = await db.Product.create(prodData);
                if (categories && categories.length) {
                    await created.setCategories(categories);
                }
            }

            console.log(`Seeding completed. ${productsToCreate.length} products created.`);
        }

        console.log('Ensuring default accounts...');

        // NOTE: pass plain passwords — the User model's hooks hash them automatically.
        await ensureDefaultAccount({
            name: 'System Admin',
            email: 'admin@macsphere.com',
            password: 'admin123',
            role: 'admin'
        });

        const user = await ensureDefaultAccount({
            name: 'Default User',
            email: 'user@macsphere.com',
            password: 'user123',
            role: 'user'
        });

        const profile = await db.CustomerProfile.findOne({ where: { user_id: user.id } });
        if (!profile) {
            await db.CustomerProfile.create({
                user_id: user.id,
                phone: '09171234567'
            });
        }

        const address = await db.Address.findOne({ where: { user_id: user.id, is_default: true } });
        if (!address) {
            await db.Address.create({
                user_id: user.id,
                address_line: '123 Apple Orchard Street',
                zipcode: '1630',
                city: 'Taguig City',
                is_default: true
            });
        }
    } catch (e) {
        console.error('Database Sync/Seed Error:', e);
    }
}

seedDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});