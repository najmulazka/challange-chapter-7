module.exports = {
  getIndex: async (req, res) => {
    let path = `${req.protocol}://${req.get('host')}`;
    res.render('index', { path });
  },
};
