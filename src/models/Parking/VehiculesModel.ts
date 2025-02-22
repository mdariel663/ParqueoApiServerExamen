import { UUID } from 'crypto'
import IDatabase from '../Database/IDatabase'
import ParkingModelError from '../Errors/ParkingModelError'
import VehiculoModelResponse from '../VehiculoModelResponse'

export interface VehiculoPrimitives {
  make: string
  model: string
  plate: string
}

class VehiculoModel {
  make!: string // marca
  model!: string // modelo
  plate!: string // matricula
  vehicle_id!: UUID | null
  isValid: boolean = false

  constructor({ make, model, plate }: VehiculoPrimitives) {
    this.fromPrimitives({ make, model, plate })
  }

  static getVehiculoByPlate = async (db: IDatabase, plateId: string): Promise<VehiculoModel | null> => {
    try {
      const result = await db.get<VehiculoPrimitives>('SELECT  make, model, plate FROM vehicles WHERE plate = ? LIMIT 1;', [plateId])
      const { plate, make, model } = result
      if (!plate || !make || !model) {
        return null
      }
      return new VehiculoModel({ make, model, plate })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e: unknown) {
      throw new ParkingModelError('Error al obtener el vehiculo')
    }
  }

  static fromJSON = ({ make, model, plate }: VehiculoPrimitives): VehiculoModel => {
    return new VehiculoModel({ make, model, plate })
  }

  toResponse = (): VehiculoModelResponse => {
    return new VehiculoModelResponse(this)
  }

  toJsonObject = (): VehiculoPrimitives => {
    return {
      make: this.make,
      model: this.model,
      plate: this.plate
    }
  }

  fromPrimitives = ({ make, model, plate }: VehiculoPrimitives): void => {
    if (!make || !model || !plate) {
      this.isValid = false
      return
    }

    this.make = make
    this.model = model
    this.plate = plate

    this.isValid = true
  }
}

export default VehiculoModel
