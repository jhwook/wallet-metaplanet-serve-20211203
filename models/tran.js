
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('transactionsoutside_2022_01_01', {
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
    username: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    privatekey: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    nettype: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    currentBlockNumber: {
      type: DataTypes.BIGINT(12).UNSIGNED,
      allowNull: false,
      defaultValue: 10000000
    },
    firstUsedBlockNumber: {
      type: DataTypes.BIGINT(12).UNSIGNED,
      allowNull: false,
      defaultValue: 11000000
    },
  },{
    sequelize,
    tableName: 'accounts'
  });
};

