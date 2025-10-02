const mongoose = require('mongoose');

<<<<<<< Updated upstream
<<<<<<< Updated upstream
mongoose.connect(process.env.MONGO_URI)
=======
mongoose.connect(process.env.mongodb+srv:josymambo858_db_user:v3VSBGbeumlMZO9m@daviddbprogress.lgcze5s.mongodb.net/)
>>>>>>> Stashed changes
=======
mongoose.connect(process.env.mongodb+srv:josymambo858_db_user:v3VSBGbeumlMZO9m@daviddbprogress.lgcze5s.mongodb.net/)
>>>>>>> Stashed changes
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => console.error(err));
