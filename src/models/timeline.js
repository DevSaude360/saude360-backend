const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Timeline extends Model {}

Timeline.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    appointment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'appointments',
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    isCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    sequelize,
    modelName: "Timeline",
    tableName: "timeline",
    underscored: true,
    timestamps: true,
});

module.exports = Timeline;
