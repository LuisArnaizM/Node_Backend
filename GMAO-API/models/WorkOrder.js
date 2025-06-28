const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class WorkOrderModel {
  constructor() {
    this.filePath = path.join(__dirname, '../data/ordenes.json');
  }

  // Leer todas las órdenes de trabajo
  async getAll() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error al leer las órdenes:', error);
      return [];
    }
  }

  // Obtener una orden por ID
  async getById(id) {
    const orders = await this.getAll();
    return orders.find(order => order.id === id);
  }

  // Crear una nueva orden de trabajo
  async create(orderData) {
    const orders = await this.getAll();
    const newOrder = {
      id: uuidv4(),
      ...orderData,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    orders.push(newOrder);
    await this.saveToFile(orders);
    return newOrder;
  }

  // Actualizar una orden de trabajo
  async update(id, updateData) {
    const orders = await this.getAll();
    const orderIndex = orders.findIndex(order => order.id === id);

    if (orderIndex === -1) {
      return null;
    }

    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updateData,
      fecha_actualizacion: new Date().toISOString()
    };

    await this.saveToFile(orders);
    return orders[orderIndex];
  }

  // Eliminar una orden de trabajo
  async delete(id) {
    const orders = await this.getAll();
    const orderIndex = orders.findIndex(order => order.id === id);

    if (orderIndex === -1) {
      return null;
    }

    const deletedOrder = orders.splice(orderIndex, 1)[0];
    await this.saveToFile(orders);
    return deletedOrder;
  }

  // Filtrar órdenes por estado
  async getByStatus(status) {
    const orders = await this.getAll();
    return orders.filter(order => order.estado === status);
  }

  // Buscar órdenes por técnico
  async getByTechnician(tecnico) {
    const orders = await this.getAll();
    return orders.filter(order => 
      order.tecnico && order.tecnico.toLowerCase().includes(tecnico.toLowerCase())
    );
  }

  // Guardar datos en el archivo
  async saveToFile(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error al guardar las órdenes:', error);
      throw new Error('Error al guardar los datos');
    }
  }

  // Obtener estadísticas
  async getStats() {
    const orders = await this.getAll();
    return {
      total: orders.length,
      pendientes: orders.filter(o => o.estado === 'pendiente').length,
      en_progreso: orders.filter(o => o.estado === 'en_progreso').length,
      finalizadas: orders.filter(o => o.estado === 'finalizada').length
    };
  }
}

module.exports = new WorkOrderModel();
