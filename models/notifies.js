/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('notifies', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    createdat: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.fn('current_timestamp')
    },
    updatedat: {
      type: DataTypes.DATE,
      allowNull: true
    },
    writer: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contentbody: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    uuid: {
      type: DataTypes.STRING(60),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'notifies'
  });
};
