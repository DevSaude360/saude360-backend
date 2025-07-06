const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");
const { supabase } = require("../config/supabase");
const Category = require('./Category');


class Document extends Model {}

Document.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'patient', key: 'id' }
    },
    documentType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    storagePath: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    mimeType: {
        type: DataTypes.STRING,
    },
    fileSize: {
        type: DataTypes.INTEGER,
    },
    fileUrl: {
        type: DataTypes.VIRTUAL,
        get() {
            const bucketName = 'document-patient';
            const { data } = supabase.storage.from(bucketName).getPublicUrl(this.storagePath);
            return data.publicUrl;
        }
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Category,
            key: 'id',
        },
        onDelete: 'SET NULL',
    },
}, {
    sequelize,
    modelName: "Document",
    tableName: "documents",
    underscored: true,
    timestamps: true,
});

module.exports = Document;
