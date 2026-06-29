export const CATEGORY_NAMES = [
  'Abarrotes',
  'Bebidas',
  'Lácteos',
  'Carnes',
  'Congelados',
  'Limpieza',
  'Higiene Personal',
  'Mascotas',
  'Ferretería',
  'Electrónicos',
  'Papelería',
  'Panadería',
  'Frutas',
  'Verduras',
  'Oficina',
  'Snacks',
  'Conservas',
  'Condimentos',
  'Cuidado del Bebé',
  'Textil',
  'Jardinería',
  'Automotriz',
  'Salud',
  'Deportes',
  'Juguetes',
] as const

export const SUBCATEGORY_TEMPLATES: Record<string, string[]> = {
  Abarrotes: ['Arroz', 'Fideos', 'Harinas', 'Aceites', 'Azúcar'],
  Bebidas: ['Gaseosas', 'Jugos', 'Aguas', 'Energizantes', 'Cervezas'],
  Lácteos: ['Leche', 'Yogurt', 'Quesos', 'Mantequilla', 'Crema'],
  Carnes: ['Res', 'Pollo', 'Cerdo', 'Pescado', 'Embutidos'],
  Congelados: ['Pizzas', 'Vegetales', 'Helados', 'Preparados', 'Mariscos'],
  Limpieza: ['Detergentes', 'Desinfectantes', 'Papel Higiénico', 'Trapeadores', 'Esponjas'],
  'Higiene Personal': ['Shampoo', 'Jabón', 'Pasta Dental', 'Desodorante', 'Toallas'],
  Mascotas: ['Alimento Perro', 'Alimento Gato', 'Arena', 'Snacks', 'Accesorios'],
  Ferretería: ['Herramientas', 'Tornillos', 'Pinturas', 'Electricidad', 'Plomería'],
  Electrónicos: ['Cables', 'Audífonos', 'Memorias USB', 'Cargadores', 'Baterías'],
  Papelería: ['Cuadernos', 'Lápices', 'Marcadores', 'Folders', 'Resaltadores'],
  Panadería: ['Pan', 'Galletas', 'Tostadas', 'Bizcochos', 'Masas'],
  Frutas: ['Manzanas', 'Plátanos', 'Naranjas', 'Uvas', 'Piñas'],
  Verduras: ['Papas', 'Cebollas', 'Tomates', 'Zanahorias', 'Lechugas'],
  Oficina: ['Archivadores', 'Grapadoras', 'Cintas', 'Etiquetas', 'Calculadoras'],
  Snacks: ['Papas Fritas', 'Galletas Saladas', 'Chocolates', 'Caramelos', 'Mix'],
  Conservas: ['Atún', 'Duraznos', 'Choclo', 'Frijoles', 'Salsas'],
  Condimentos: ['Sal', 'Pimienta', 'Comino', 'Ají', 'Sazonadores'],
  'Cuidado del Bebé': ['Pañales', 'Toallitas', 'Fórmulas', 'Cereales', 'Shampoo Bebé'],
  Textil: ['Toallas', 'Sábanas', 'Cortinas', 'Alfombras', 'Manteles'],
  Jardinería: ['Fertilizantes', 'Semillas', 'Macetas', 'Mangueras', 'Tierra'],
  Automotriz: ['Aceites Motor', 'Lubricantes', 'Limpiadores', 'Accesorios', 'Bujías'],
  Salud: ['Vitaminas', 'Analgésicos', 'Curitas', 'Alcohol', 'Termómetros'],
  Deportes: ['Botellas', 'Pelotas', 'Cuerdas', 'Guantes', 'Mochilas'],
  Juguetes: ['Peluches', 'Juegos Mesa', 'Rompecabezas', 'Carritos', 'Arte'],
}

export const UNIT_DEFINITIONS = [
  { name: 'Unidad', abbreviation: 'UND' },
  { name: 'Caja', abbreviation: 'CJA' },
  { name: 'Paquete', abbreviation: 'PAQ' },
  { name: 'Docena', abbreviation: 'DOC' },
  { name: 'Litro', abbreviation: 'LTR' },
  { name: 'Mililitro', abbreviation: 'ML' },
  { name: 'Kilogramo', abbreviation: 'KG' },
  { name: 'Gramo', abbreviation: 'GR' },
  { name: 'Metro', abbreviation: 'MTR' },
  { name: 'Centímetro', abbreviation: 'CM' },
  { name: 'Galón', abbreviation: 'GAL' },
  { name: 'Botella', abbreviation: 'BOT' },
  { name: 'Lata', abbreviation: 'LTA' },
  { name: 'Bolsa', abbreviation: 'BLS' },
  { name: 'Saco', abbreviation: 'SAC' },
] as const

export const BRAND_NAMES = [
  'Gloria', 'Nestlé', 'Alicorp', 'Laive', 'Coca-Cola', 'Backus', 'San Jorge', 'Molitalia',
  'Field', 'Elite', 'Pilot', 'Faber Castell', 'HP', 'Logitech', 'Samsung', 'LG',
  'Unilever', 'P&G', 'Colgate', 'Johnson', 'Bimbo', 'Donofrio', 'Costeño', 'Primor',
  'Cif', 'Ajax', 'Clorox', 'Scott', 'Suave', 'Pantene', 'Head & Shoulders', 'Rexona',
  'Pedigree', 'Whiskas', 'Purina', 'Mars', 'Oreo', 'Lays', 'Doritos', 'Pringles',
  'Red Bull', 'Monster', 'Inca Kola', 'Kola Real', 'Pilsen', 'Cristal', 'Arequipeña',
  'Sublime', 'Princesa', 'Ambrosoli', 'McCain', 'Frugos', 'Watt\'s', 'Bolthouse',
  'Stanley', 'Tramontina', 'Bosch', 'Black+Decker', 'Makita', 'Dewalt',
  'Genérico', 'Marca Propia', 'Distribuidora Andina', 'EcoLimpio', 'BioFresh',
  'AndesTech', 'PeruPaper', 'LimaTools', 'CuscoCraft', 'NorteSnack', 'SurBebidas',
  'ValleVerde', 'CostaAzul', 'SierraGold', 'AmazonFresh', 'InkaSelect', 'AndinaPro',
  'MaxiAhorro', 'SuperValue', 'PremiumLine', 'EcoPack', 'FreshDaily',
] as const

export const SUPPLIER_NAMES = [
  'Distribuidora Lima Norte SAC', 'Comercial Andina EIRL', 'Importaciones del Pacífico SAC',
  'Alimentos San Martín SA', 'Ferretería Industrial Perú SAC', 'Papelería Central EIRL',
  'Lácteos del Valle SAC', 'Bebidas Refresh SA', 'Textiles Cusco SAC', 'Electro Mayorista EIRL',
  'Carnes Premium del Perú SAC', 'Congelados Andinos SA', 'Limpieza Total SAC',
  'Higiene y Cuidado EIRL', 'Mascotas Felices SAC', 'Juguetes Mágicos EIRL',
  'Farmacia Mayorista SAC', 'Deportes Activo SA', 'Jardín Verde EIRL', 'AutoPartes Perú SAC',
  'Conservas del Mar SA', 'Snacks Peruanos SAC', 'Condimentos Gourmet EIRL',
  'Oficina Express SAC', 'Panadería Mayorista SA', 'Frutas Tropicales SAC',
  'Verduras Frescas EIRL', 'Tecnología Lima SAC', 'Cables y Más EIRL', 'Herramientas Pro SAC',
  'Pinturas Color SA', 'Plásticos Industriales SAC', 'Embalajes Perú EIRL',
  'Químicos Andinos SAC', 'Bebidas Gaseosas SA', 'Cervecería Mayorista EIRL',
  'Leche y Derivados SAC', 'Quesos Finos SA', 'Carnes Frigorífico EIRL',
  'Pescados del Pacífico SAC', 'Pan Industrial SA', 'Galletas Nacional EIRL',
  'Chocolates Premium SAC', 'Caramelos Dulce SA', 'Cereales Nutri EIRL',
  'Pañales Bebé SAC', 'Vitaminas Salud SA', 'Botiquín Express EIRL',
  'Pelotas Deportivas SAC', 'Mochilas Trek SA', 'Semillas Orgánicas EIRL',
  'Fertilizantes Verde SAC', 'Aceites Motor SA', 'Lubricantes Pro EIRL',
  'Toallas Hogar SAC', 'Sábanas Confort SA', 'Cortinas Deco EIRL',
  'Calculadoras Office SAC', 'Resaltadores Color SA', 'Cuadernos Escolar EIRL',
  'Audífonos Tech SAC', 'Cargadores USB SA', 'Baterías Power EIRL',
  'Arena Gatos SAC', 'Alimento Perro Pro SA', 'Snacks Mascota EIRL',
  'Desinfectantes Clín SA', 'Detergentes Ropa SA', 'Esponjas Limpia EIRL',
  'Shampoo Natural SAC', 'Jabón Líquido SA', 'Pasta Dental Pro EIRL',
  'Arroz Costeño Mayor SAC', 'Fideos La Moderna SA', 'Aceite Oliva EIRL',
  'Azúcar Rubio SAC', 'Sal Marina SA', 'Sazonador Gourmet EIRL',
  'Atún Conserva SAC', 'Duraznos Lata SA', 'Salsa Tomate EIRL',
  'Energizantes Boost SAC', 'Agua Mineral SA', 'Jugo Natural EIRL',
  'Helados Frío SAC', 'Pizza Congelada SA', 'Vegetales Mix EIRL',
  'Tornillos Pack SAC', 'Cable Eléctrico SA', 'Bombillas LED EIRL',
  'Marcadores Pilot SAC', 'Lápices Grafito SA', 'Folders Archivo EIRL',
  'Manzanas Valle SAC', 'Plátano Orgánico SA', 'Papa Andina EIRL',
  'Tomate Fresco SAC', 'Lechuga Hidro SA', 'Zanahoria Campo EIRL',
  'Rompecabezas Fun SAC', 'Peluche Suave SA', 'Carrito Juguete EIRL',
  'Guantes Box SAC', 'Cuerda Fitness SA', 'Botella Sport EIRL',
  'Maceta Jardín SAC', 'Manguera Riego SA', 'Tierra Fértil EIRL',
  'Analgésicos Farma SAC', 'Curitas Pro SA', 'Alcohol Gel EIRL',
] as const

export const FIRST_NAMES = [
  'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Rosa', 'Pedro', 'Lucía', 'Jorge', 'Carmen',
  'Miguel', 'Elena', 'José', 'Patricia', 'Fernando', 'Sofía', 'Ricardo', 'Valeria', 'Diego',
  'Gabriela', 'Andrés', 'Daniela', 'Roberto', 'Claudia', 'Alberto', 'Verónica', 'Héctor',
  'Natalia', 'Óscar', 'Paola', 'Raúl', 'Mónica', 'Sergio', 'Adriana', 'Manuel', 'Silvia',
  'Eduardo', 'Karina', 'Arturo', 'Jessica', 'Julio', 'Mariana', 'César', 'Angélica',
] as const

export const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez',
  'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez',
  'Ortiz', 'Ramos', 'Mendoza', 'Castillo', 'Vargas', 'Ruiz', 'Herrera', 'Medina', 'Aguilar',
  'Vega', 'Rojas', 'Silva', 'Castro', 'Quispe', 'Huamán', 'Condori', 'Mamani', 'Choque',
  'Paredes', 'Salazar', 'Delgado', 'Campos', 'Navarro', 'Ibarra', 'Ponce', 'Valdez',
] as const

export const CITIES = [
  'Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Cusco', 'Iquitos', 'Huancayo',
  'Tacna', 'Juliaca', 'Cajamarca', 'Pucallpa', 'Sullana', 'Chincha', 'Huaraz',
] as const

export const STREETS = [
  'Av. Javier Prado', 'Jr. de la Unión', 'Av. Arequipa', 'Calle Las Flores', 'Av. La Marina',
  'Jr. Lampa', 'Av. Brasil', 'Calle Los Pinos', 'Av. Angamos', 'Jr. Cusco',
  'Av. Tacna', 'Calle San Martín', 'Av. Colonial', 'Jr. Huancavelica', 'Av. Universitaria',
] as const

export const PRODUCT_ADJECTIVES = [
  'Premium', 'Económico', 'Familiar', 'Light', 'Zero', 'Natural', 'Orgánico', 'Clásico',
  'Extra', 'Super', 'Deluxe', 'Fresco', 'Integral', 'Diet', 'Gold', 'Select',
] as const

export const PRODUCT_SIZES = [
  '250g', '500g', '1kg', '1.5kg', '2kg', '250ml', '500ml', '1L', '1.5L', '2L',
  'Pack x6', 'Pack x12', 'Pack x24', 'Unidad', 'Caja x12',
] as const

export const UNIT_EQUIVALENCE_DEFINITIONS = [
  { from: 'CJA', to: 'UND', factor: 12, label: '1 Caja = 12 Unidades' },
  { from: 'PAQ', to: 'UND', factor: 6, label: '1 Paquete = 6 Unidades' },
  { from: 'DOC', to: 'UND', factor: 12, label: '1 Docena = 12 Unidades' },
  { from: 'KG', to: 'GR', factor: 1000, label: '1 Kilogramo = 1000 Gramos' },
  { from: 'LTR', to: 'ML', factor: 1000, label: '1 Litro = 1000 Mililitros' },
  { from: 'GAL', to: 'LTR', factor: 3.785, label: '1 Galón = 3.785 Litros' },
  { from: 'SAC', to: 'KG', factor: 50, label: '1 Saco = 50 Kilogramos' },
  { from: 'BLS', to: 'KG', factor: 1, label: '1 Bolsa = 1 Kilogramo' },
  { from: 'BOT', to: 'LTR', factor: 1, label: '1 Botella = 1 Litro' },
  { from: 'LTA', to: 'UND', factor: 1, label: '1 Lata = 1 Unidad' },
] as const

export const PROMOTION_TITLES = [
  '2x1 en bebidas seleccionadas', '20% en lácteos del mes', 'Descuento en snacks familiares',
  'Combo desayuno andino', 'Precio especial en limpieza', 'Oferta ferretería fin de semana',
  '3x2 en higiene personal', 'Mega promo abarrotes', 'Happy hour gaseosas', 'Pack ahorro mascotas',
  'Back to school papelería', 'Flash sale electrónicos', 'Descuento carnes premium',
  'Promo congelados familiares', 'Semana del chocolate', 'Oferta frutas y verduras',
  'Combo oficina', 'Descuento textil hogar', 'Promo jardinería primavera', 'Aceite + arroz combo',
  'Descuento cervezas', 'Oferta panadería', 'Promo salud y bienestar', 'Descuento deportes',
  'Juguetes con regalo', 'Conservas a precio mayorista', 'Condimentos pack ahorro',
  'Bebé: pañales + toallitas', 'Automotriz: aceite + filtro', 'Black Friday andino',
] as const

export const NOTIFICATION_SAMPLES = [
  { title: 'Stock bajo', message: 'El producto tiene stock por debajo del mínimo configurado.', type: 'warning' as const, priority: 'high' as const },
  { title: 'Compra pendiente', message: 'Hay una orden de compra pendiente de recepción.', type: 'info' as const, priority: 'medium' as const },
  { title: 'Recepción completada', message: 'Se completó la recepción de mercadería en almacén principal.', type: 'success' as const, priority: 'medium' as const },
  { title: 'Venta registrada', message: 'Se registró una nueva venta en el sistema.', type: 'success' as const, priority: 'low' as const },
  { title: 'Producto agotado', message: 'Un producto quedó sin stock disponible.', type: 'error' as const, priority: 'high' as const },
] as const
