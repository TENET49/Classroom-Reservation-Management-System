import { Sequelize } from "sequelize";

const sequelize = new Sequelize('classroom_reservation_system', 'root', '123456', {
  host: 'localhost',
  dialect: 'mysql',
  logging: null
});



export default sequelize;