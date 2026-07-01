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
                { name: 'iPad' }
            ]);

            console.log('Seeding default products...');

            const macCat = categories.find(c => c.name === 'MacBook');
            const iphoneCat = categories.find(c => c.name === 'iPhone');
            const ipadCat = categories.find(c => c.name === 'iPad');

            // Create products and attach categories via the join table
            const productsToCreate = [
                {
                    name: 'MacBook Air M3 (13-inch)',
                    description: 'The incredibly thin MacBook Air with M3 chip breezes through work and play.',
                    categories: [macCat.id],
                    cost_price: 55000.00,
                    sell_price: 59990.00,
                    stock_quantity: 15,
                    color: 'Space Gray',
                    storage: '256GB SSD',
                    is_active: true,
                    img_path: 'images/macbook_air_m3.jpg'
                },
                {
                    name: 'MacBook Pro M3 Max (16-inch)',
                    description: 'The ultimate laptop for developers, creators, and professionals.',
                    categories: [macCat.id],
                    cost_price: 180000.00,
                    sell_price: 199990.00,
                    stock_quantity: 5,
                    color: 'Space Black',
                    storage: '1TB SSD',
                    is_active: true,
                    img_path: 'images/macbook_pro_m3.jpg'
                },
                {
                    name: 'iPhone 15 Pro Max',
                    description: 'Forged in titanium and featuring the groundbreaking A17 Pro chip.',
                    categories: [iphoneCat.id],
                    cost_price: 70000.00,
                    sell_price: 79990.00,
                    stock_quantity: 25,
                    color: 'Natural Titanium',
                    storage: '256GB',
                    is_active: true,
                    img_path: 'images/iphone15_pro_max.jpg'
                },
                {
                    name: 'iPad Pro M4 (13-inch)',
                    description: 'Impossibly thin design with outrageous performance and the breakthrough Ultra Retina XDR display.',
                    categories: [ipadCat.id],
                    cost_price: 75000.00,
                    sell_price: 82990.00,
                    stock_quantity: 8,
                    color: 'Silver',
                    storage: '512GB',
                    is_active: true,
                    img_path: 'images/ipad_pro_m4.jpg'
                }
            ];

            for (const p of productsToCreate) {
                const { categories, ...prodData } = p;
                const created = await db.Product.create(prodData);
                if (categories && categories.length) {
                    await created.setCategories(categories);
                }
            }

            console.log('Seeding completed.');
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