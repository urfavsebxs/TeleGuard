import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  registrationDate: Date;
  paymentDurationDays: number;
  expirationDate: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  extendSubscription(additionalDays: number): Promise<this>;
  reduceSubscription(daysToReduce: number): Promise<this>;
}

const UserSchema = new Schema<IUser>(
  {
    telegramId: {
      type: String,
      required: [true, 'El ID de Telegram es obligatorio'],
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    registrationDate: {
      type: Date,
      required: [true, 'La fecha de registro es obligatoria'],
      default: Date.now,
    },
    paymentDurationDays: {
      type: Number,
      required: [true, 'La duración del pago es obligatoria'],
      min: [0, 'La duración mínima es 0 días'],
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true, // Incluir campos virtuales en JSON
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true, // Incluir campos virtuales en objetos
    },
  }
);

// Campo virtual para calcular días restantes en tiempo real
UserSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const expDate = new Date(this.expirationDate);
  const diffTime = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays); // No permitir valores negativos
});

// Middleware para calcular fecha de expiración antes de guardar
UserSchema.pre('save', function(next) {
  // Solo recalcular si expirationDate NO está establecida manualmente
  // o si se modificó registrationDate/paymentDurationDays Y expirationDate no fue tocada
  if (!this.isModified('expirationDate') && 
      (this.isModified('registrationDate') || this.isModified('paymentDurationDays'))) {
    const expDate = new Date(this.registrationDate);
    expDate.setDate(expDate.getDate() + this.paymentDurationDays);
    this.expirationDate = expDate;
  }
  next();
});

// Índices
UserSchema.index({ expirationDate: 1, isActive: 1 });
UserSchema.index({ isActive: 1 });

// Método estático para encontrar usuarios expirados
UserSchema.statics.findExpiredUsers = function() {
  return this.find({
    isActive: true,
    expirationDate: { $lte: new Date() },
  });
};

// Método para verificar si el usuario está expirado
UserSchema.methods.isExpired = function(): boolean {
  return this.expirationDate <= new Date();
};

// Método para extender suscripción
UserSchema.methods.extendSubscription = function(additionalDays: number) {
  this.paymentDurationDays += additionalDays;
  
  // Asegurar que no sea negativo
  if (this.paymentDurationDays < 0) {
    this.paymentDurationDays = 0;
  }
  
  const newExpDate = new Date(this.registrationDate);
  newExpDate.setDate(newExpDate.getDate() + this.paymentDurationDays);
  this.expirationDate = newExpDate;
  
  // Si la nueva fecha de expiración es futura, reactivar usuario
  if (newExpDate > new Date()) {
    this.isActive = true;
  }
  
  return this.save();
};

// Método para reducir suscripción
UserSchema.methods.reduceSubscription = function(daysToReduce: number) {
  this.paymentDurationDays -= daysToReduce;
  
  // Asegurar que no sea negativo
  if (this.paymentDurationDays < 0) {
    this.paymentDurationDays = 0;
  }
  
  const newExpDate = new Date(this.registrationDate);
  newExpDate.setDate(newExpDate.getDate() + this.paymentDurationDays);
  this.expirationDate = newExpDate;
  
  return this.save();
};

export const User = mongoose.model<IUser>('User', UserSchema);
