const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class ExamStatus extends Model {}

ExamStatus.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
}, {
    sequelize,
    modelName: "ExamStatus",
    tableName: "exam_statuses",
    timestamps: false,
});

module.exports = ExamStatus;
