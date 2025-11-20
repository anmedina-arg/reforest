/**
 * Utilidad para conversión y comparación de unidades de medida
 */

// =====================================================
// TYPES
// =====================================================

export type TipoUnidad = 'peso' | 'volumen' | 'unidad';

export interface UnidadConversion {
  nombre: string;
  abreviatura: string;
  tipo: TipoUnidad;
  factorConversion: number; // Factor para convertir a unidad base
}

// =====================================================
// CONSTANTES
// =====================================================

/**
 * Mapeo de unidades conocidas con sus factores de conversión
 * La unidad base para peso es el gramo (g)
 * La unidad base para volumen es el mililitro (ml)
 */
export const UNIDADES_CONOCIDAS: Record<string, UnidadConversion> = {
  // Peso
  kilogramo: {
    nombre: 'kilogramo',
    abreviatura: 'kg',
    tipo: 'peso',
    factorConversion: 1000,
  },
  kg: {
    nombre: 'kilogramo',
    abreviatura: 'kg',
    tipo: 'peso',
    factorConversion: 1000,
  },
  gramo: {
    nombre: 'gramo',
    abreviatura: 'g',
    tipo: 'peso',
    factorConversion: 1,
  },
  g: { nombre: 'gramo', abreviatura: 'g', tipo: 'peso', factorConversion: 1 },

  // Volumen
  litro: {
    nombre: 'litro',
    abreviatura: 'l',
    tipo: 'volumen',
    factorConversion: 1000,
  },
  l: {
    nombre: 'litro',
    abreviatura: 'l',
    tipo: 'volumen',
    factorConversion: 1000,
  },
  mililitro: {
    nombre: 'mililitro',
    abreviatura: 'ml',
    tipo: 'volumen',
    factorConversion: 1,
  },
  ml: {
    nombre: 'mililitro',
    abreviatura: 'ml',
    tipo: 'volumen',
    factorConversion: 1,
  },

  // Unidades contables
  unidad: {
    nombre: 'unidad',
    abreviatura: 'u',
    tipo: 'unidad',
    factorConversion: 1,
  },
  u: {
    nombre: 'unidad',
    abreviatura: 'u',
    tipo: 'unidad',
    factorConversion: 1,
  },
};

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

/**
 * Convierte una cantidad de cualquier unidad a su unidad base
 * @param cantidad - Cantidad a convertir
 * @param unidad - Nombre o abreviatura de la unidad (case-insensitive)
 * @returns Cantidad convertida a unidad base (gramos, mililitros o unidades)
 * @throws Error si la unidad no es reconocida
 *
 * @example
 * convertToBaseUnit(2, 'kilogramo') // 2000 gramos
 * convertToBaseUnit(1.5, 'litro')   // 1500 mililitros
 * convertToBaseUnit(500, 'g')       // 500 gramos
 */
export function convertToBaseUnit(cantidad: number, unidad: string): number {
  const unidadLower = unidad.toLowerCase().trim();
  const conversionInfo = UNIDADES_CONOCIDAS[unidadLower];

  if (!conversionInfo) {
    throw new Error(
      `Unidad "${unidad}" no reconocida. Unidades válidas: ${Object.keys(
        UNIDADES_CONOCIDAS
      ).join(', ')}`
    );
  }

  return cantidad * conversionInfo.factorConversion;
}

/**
 * Obtiene el nombre de la unidad base para un tipo de unidad
 * @param tipo - Tipo de unidad (peso, volumen, unidad)
 * @returns Nombre de la unidad base
 *
 * @example
 * getBaseUnit('peso')    // 'gramo'
 * getBaseUnit('volumen') // 'mililitro'
 * getBaseUnit('unidad')  // 'unidad'
 */
export function getBaseUnit(tipo: TipoUnidad): string {
  switch (tipo) {
    case 'peso':
      return 'gramo';
    case 'volumen':
      return 'mililitro';
    case 'unidad':
      return 'unidad';
    default:
      throw new Error(`Tipo de unidad "${tipo}" no válido`);
  }
}

/**
 * Obtiene el tipo de unidad (peso, volumen, unidad) para una unidad dada
 * @param unidad - Nombre o abreviatura de la unidad
 * @returns Tipo de unidad
 * @throws Error si la unidad no es reconocida
 *
 * @example
 * getTipoUnidad('kilogramo') // 'peso'
 * getTipoUnidad('ml')        // 'volumen'
 * getTipoUnidad('unidad')    // 'unidad'
 */
export function getTipoUnidad(unidad: string): TipoUnidad {
  const unidadLower = unidad.toLowerCase().trim();
  const conversionInfo = UNIDADES_CONOCIDAS[unidadLower];

  if (!conversionInfo) {
    throw new Error(
      `Unidad "${unidad}" no reconocida. Unidades válidas: ${Object.keys(
        UNIDADES_CONOCIDAS
      ).join(', ')}`
    );
  }

  return conversionInfo.tipo;
}

/**
 * Compara si el stock disponible es suficiente para la cantidad requerida
 * Ambas cantidades se convierten a la unidad base antes de comparar
 *
 * @param stockCantidad - Cantidad disponible en stock
 * @param stockUnidad - Unidad del stock
 * @param requiredCantidad - Cantidad requerida
 * @param requiredUnidad - Unidad de la cantidad requerida
 * @returns true si el stock es suficiente, false si no
 * @throws Error si las unidades no son compatibles (ej: comparar peso con volumen)
 *
 * @example
 * compareStock(2, 'kilogramo', 1500, 'gramo')  // true (2000g >= 1500g)
 * compareStock(1, 'litro', 1200, 'ml')         // false (1000ml < 1200ml)
 * compareStock(5, 'kg', 3, 'litro')            // Error: unidades incompatibles
 */
export function compareStock(
  stockCantidad: number,
  stockUnidad: string,
  requiredCantidad: number,
  requiredUnidad: string
): boolean {
  // Validar que las unidades sean compatibles
  const tipoStock = getTipoUnidad(stockUnidad);
  const tipoRequired = getTipoUnidad(requiredUnidad);

  if (tipoStock !== tipoRequired) {
    throw new Error(
      `No se pueden comparar unidades de diferentes tipos: "${stockUnidad}" (${tipoStock}) vs "${requiredUnidad}" (${tipoRequired})`
    );
  }

  // Convertir ambas cantidades a unidad base
  const stockEnBase = convertToBaseUnit(stockCantidad, stockUnidad);
  const requiredEnBase = convertToBaseUnit(requiredCantidad, requiredUnidad);

  return stockEnBase >= requiredEnBase;
}

/**
 * Convierte una cantidad de una unidad a otra unidad compatible
 * @param cantidad - Cantidad a convertir
 * @param unidadOrigen - Unidad de origen
 * @param unidadDestino - Unidad de destino
 * @returns Cantidad convertida a la unidad de destino
 * @throws Error si las unidades no son compatibles
 *
 * @example
 * convertUnit(2, 'kilogramo', 'gramo')  // 2000
 * convertUnit(1500, 'ml', 'litro')      // 1.5
 * convertUnit(2, 'kg', 'litro')         // Error: unidades incompatibles
 */
export function convertUnit(
  cantidad: number,
  unidadOrigen: string,
  unidadDestino: string
): number {
  // Validar que las unidades sean compatibles
  const tipoOrigen = getTipoUnidad(unidadOrigen);
  const tipoDestino = getTipoUnidad(unidadDestino);

  if (tipoOrigen !== tipoDestino) {
    throw new Error(
      `No se pueden convertir unidades de diferentes tipos: "${unidadOrigen}" (${tipoOrigen}) vs "${unidadDestino}" (${tipoDestino})`
    );
  }

  // Convertir a unidad base y luego a la unidad destino
  const cantidadBase = convertToBaseUnit(cantidad, unidadOrigen);
  const unidadDestinoLower = unidadDestino.toLowerCase().trim();
  const conversionInfo = UNIDADES_CONOCIDAS[unidadDestinoLower];

  return cantidadBase / conversionInfo.factorConversion;
}

/**
 * Formatea una cantidad con su unidad de forma legible
 * @param cantidad - Cantidad a formatear
 * @param unidad - Unidad de la cantidad
 * @param locale - Locale para formateo de números (default: 'es-AR')
 * @returns String formateado (ej: "2,500 kg")
 *
 * @example
 * formatCantidad(2500, 'gramo')      // "2,500 g"
 * formatCantidad(1.5, 'litro')       // "1.5 l"
 * formatCantidad(1000, 'ml', 'en')   // "1,000 ml"
 */
export function formatCantidad(
  cantidad: number,
  unidad: string,
  locale: string = 'es-AR'
): string {
  const unidadLower = unidad.toLowerCase().trim();
  const conversionInfo = UNIDADES_CONOCIDAS[unidadLower];

  const abreviatura = conversionInfo?.abreviatura || unidad;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${formatter.format(cantidad)} ${abreviatura}`;
}

/**
 * Formatea una cantidad con unidad adaptativa para mejor legibilidad
 * Convierte automáticamente a unidades mayores cuando la cantidad >= 1000
 *
 * @param cantidad - Cantidad a formatear
 * @param unidadBase - Unidad base de la cantidad
 * @param locale - Locale para formateo de números (default: 'es-AR')
 * @returns String formateado con unidad adaptada
 *
 * @example
 * formatCantidadConUnidad(50000, 'g')    // "50 kg"
 * formatCantidadConUnidad(750, 'g')      // "750 g"
 * formatCantidadConUnidad(1500, 'ml')    // "1.5 l"
 * formatCantidadConUnidad(250, 'ml')     // "250 ml"
 * formatCantidadConUnidad(100, 'unidad') // "100 u"
 * formatCantidadConUnidad(5000, 'u')     // "5,000 u" (unidades no se convierten)
 */
export function formatCantidadConUnidad(
  cantidad: number,
  unidadBase: string,
  locale: string = 'es-AR'
): string {
  const unidadLower = unidadBase.toLowerCase().trim();
  const conversionInfo = UNIDADES_CONOCIDAS[unidadLower];

  // Si la unidad no es reconocida, usar formateo simple
  if (!conversionInfo) {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return `${formatter.format(cantidad)} ${unidadBase}`;
  }

  const tipo = conversionInfo.tipo;
  let cantidadFinal = cantidad;
  let unidadFinal = conversionInfo.abreviatura;

  // Conversión adaptativa solo para peso y volumen
  if (cantidad >= 1000 && (tipo === 'peso' || tipo === 'volumen')) {
    // Si la unidad es base (g o ml), convertir a mayor (kg o l)
    const esUnidadBase =
      (tipo === 'peso' && (unidadLower === 'g' || unidadLower === 'gramo')) ||
      (tipo === 'volumen' &&
        (unidadLower === 'ml' || unidadLower === 'mililitro'));

    if (esUnidadBase) {
      // Convertir a unidad mayor
      cantidadFinal = cantidad / 1000;

      // Cambiar unidad
      if (tipo === 'peso') {
        unidadFinal = 'kg';
      } else if (tipo === 'volumen') {
        unidadFinal = 'l';
      }
    }
  }

  // Formatear número con locale
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${formatter.format(cantidadFinal)} ${unidadFinal}`;
}
