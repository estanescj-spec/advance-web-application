const db = require('../models');
const Address = db.Address;

exports.getMyAddresses = async (req, res) => {
    try {
        const addresses = await Address.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']]
        });
        return res.status(200).json({ success: true, rows: addresses });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch addresses' });
    }
};

exports.addAddress = async (req, res) => {
    try {
        const { address_line, zipcode, city, is_default } = req.body;
        
        // If this is the first address, make it default automatically
        const count = await Address.count({ where: { user_id: req.user.id } });
        const shouldBeDefault = count === 0 ? true : !!is_default;

        const address = await Address.create({
            user_id: req.user.id,
            address_line,
            zipcode,
            city,
            is_default: shouldBeDefault
        });

        return res.status(201).json({ success: true, result: address });
    } catch (err) {
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') });
        }
        console.error(err);
        return res.status(500).json({ error: 'Failed to create address' });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // The beforeDestroy/afterDestroy hook in the model will promote a new default if needed
        await address.destroy();

        return res.status(200).json({ success: true, message: 'Address deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to delete address' });
    }
};

exports.setDefault = async (req, res) => {
    try {
        const address = await Address.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // The beforeSave hook in the model handles un-setting the previous default
        await address.update({ is_default: true });

        return res.status(200).json({ success: true, message: 'Default address updated' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to set default address' });
    }
};
