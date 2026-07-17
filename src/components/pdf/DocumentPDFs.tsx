import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { type Reporte, type Presupuesto, type Instructivo } from '@/services/documentService';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 50,
    lineHeight: 1.5,
    color: '#2d3748',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3182ce',
  },
  docTypeName: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: '#718096',
    marginTop: 5,
  },
  metaBlock: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f7fafc',
    borderRadius: 6,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    width: 100,
    color: '#718096',
    fontWeight: 'bold',
  },
  metaValue: {
    flex: 1,
    color: '#2d3748',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3182ce',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
    paddingBottom: 3,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 9.5,
    color: '#2d3748',
    textAlign: 'justify',
  },
  // Table styles for budget
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomWidth: 0,
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    alignItems: 'center',
    minHeight: 24,
  },
  tableHeaderRow: {
    backgroundColor: '#f7fafc',
  },
  tableCellDesc: {
    width: '50%',
    paddingLeft: 8,
    fontSize: 9,
  },
  tableCellQty: {
    width: '15%',
    textAlign: 'center',
    fontSize: 9,
  },
  tableCellPrice: {
    width: '18%',
    textAlign: 'right',
    paddingRight: 8,
    fontSize: 9,
  },
  tableCellSubtotal: {
    width: '17%',
    textAlign: 'right',
    paddingRight: 8,
    fontSize: 9,
    fontWeight: 'bold',
  },
  totalsBlock: {
    alignItems: 'flex-end',
    marginTop: 15,
    paddingRight: 8,
  },
  totalRow: {
    flexDirection: 'row',
    marginBottom: 4,
    fontSize: 9,
  },
  totalLabel: {
    width: 120,
    textAlign: 'right',
    color: '#718096',
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    color: '#2d3748',
  },
  grandTotalRow: {
    flexDirection: 'row',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  grandTotalLabel: {
    width: 120,
    textAlign: 'right',
    color: '#1a202c',
  },
  grandTotalValue: {
    width: 100,
    textAlign: 'right',
    color: '#3182ce',
  },
  // Blocks for instructivos
  blockTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 10,
    marginBottom: 5,
  },
  blockText: {
    fontSize: 9.5,
    color: '#4a5568',
    marginBottom: 8,
    textAlign: 'justify',
  },
  blockImageNote: {
    fontSize: 8,
    color: '#a0aec0',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#a0aec0',
    fontSize: 8,
  }
});

const fmt = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

export function ReportePDF({ reporte }: { reporte: Reporte }) {
  const consorcioNombre = reporte.consorcios?.nombre || 'N/A';
  const adminNombre = reporte.consorcios?.administraciones?.nombre || 'N/A';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>SafeLink</Text>
            <Text style={styles.docTypeName}>Reporte Técnico</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#718096' }}>Fecha: {reporte.fecha}</Text>
            <Text style={{ color: '#a0aec0', marginTop: 2 }}>v{reporte.version}</Text>
          </View>
        </View>

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Consorcio:</Text>
            <Text style={styles.metaValue}>{consorcioNombre}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Administración:</Text>
            <Text style={styles.metaValue}>{adminNombre}</Text>
          </View>
        </View>

        <Text style={styles.title}>{reporte.titulo}</Text>

        {[
          { key: 'motivo', label: 'Motivo de la Visita' },
          { key: 'descripcion', label: 'Descripción de la Situación' },
          { key: 'diagnostico', label: 'Diagnóstico Técnico' },
          { key: 'trabajo_realizado', label: 'Trabajos Realizados' },
          { key: 'recomendaciones', label: 'Recomendaciones' },
          { key: 'conclusiones', label: 'Conclusiones' },
          { key: 'observaciones', label: 'Observaciones' },
        ].map((sec) => {
          const content = (reporte as any)[sec.key];
          if (!content || String(content).trim() === '') return null;
          return (
            <View key={sec.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{sec.label}</Text>
              <Text style={styles.sectionBody}>{content}</Text>
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text>SafeLink — Gestión Técnica de Consorcios</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function PresupuestoPDF({ presupuesto }: { presupuesto: Presupuesto }) {
  const consorcioNombre = presupuesto.consorcios?.nombre || 'N/A';
  const adminNombre = presupuesto.consorcios?.administraciones?.nombre || 'N/A';
  const subtotal = (presupuesto.materiales || []).reduce((acc, m) => acc + (m.subtotal || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>SafeLink</Text>
            <Text style={styles.docTypeName}>Presupuesto</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#718096' }}>Fecha: {presupuesto.fecha}</Text>
            <Text style={{ color: '#a0aec0', marginTop: 2 }}>v{presupuesto.version}</Text>
          </View>
        </View>

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Consorcio:</Text>
            <Text style={styles.metaValue}>{consorcioNombre}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Administración:</Text>
            <Text style={styles.metaValue}>{adminNombre}</Text>
          </View>
        </View>

        <Text style={styles.title}>{presupuesto.titulo}</Text>

        {presupuesto.materiales?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materiales y Trabajos Detallados</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text style={styles.tableCellDesc}>Descripción</Text>
                <Text style={styles.tableCellQty}>Cant.</Text>
                <Text style={styles.tableCellPrice}>Precio Unit.</Text>
                <Text style={styles.tableCellSubtotal}>Subtotal</Text>
              </View>
              {presupuesto.materiales.map((m, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.tableCellDesc}>{m.nombre}</Text>
                  <Text style={styles.tableCellQty}>{m.cantidad}</Text>
                  <Text style={styles.tableCellPrice}>{fmt(m.precio_unitario)}</Text>
                  <Text style={styles.tableCellSubtotal}>{fmt(m.subtotal)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal materiales:</Text>
            <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
          </View>
          {presupuesto.mano_obra > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Mano de obra:</Text>
              <Text style={styles.totalValue}>{fmt(presupuesto.mano_obra)}</Text>
            </View>
          )}
          {presupuesto.descuentos > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Descuentos:</Text>
              <Text style={styles.totalValue}>- {fmt(presupuesto.descuentos)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>{fmt(presupuesto.total)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          {presupuesto.validez && (
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ width: 120, color: '#718096', fontSize: 9 }}>Validez del presupuesto:</Text>
              <Text style={{ fontSize: 9 }}>{presupuesto.validez}</Text>
            </View>
          )}
          {presupuesto.garantia && (
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ width: 120, color: '#718096', fontSize: 9 }}>Garantía ofrecida:</Text>
              <Text style={{ fontSize: 9 }}>{presupuesto.garantia}</Text>
            </View>
          )}
        </View>

        {presupuesto.condiciones && (
          <View style={[styles.section, { marginTop: 15 }]}>
            <Text style={styles.sectionTitle}>Condiciones de Pago / Ejecución</Text>
            <Text style={styles.sectionBody}>{presupuesto.condiciones}</Text>
          </View>
        )}

        {presupuesto.observaciones && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text style={styles.sectionBody}>{presupuesto.observaciones}</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>SafeLink — Gestión Técnica de Consorcios</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function InstructivoPDF({ instructivo }: { instructivo: Instructivo }) {
  const consorcioNombre = instructivo.consorcios?.nombre || 'N/A';
  const adminNombre = instructivo.consorcios?.administraciones?.nombre || 'N/A';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>SafeLink</Text>
            <Text style={styles.docTypeName}>Instructivo / Manual de Uso</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#718096' }}>Consorcio: {consorcioNombre}</Text>
            <Text style={{ color: '#a0aec0', marginTop: 2 }}>v{instructivo.version}</Text>
          </View>
        </View>

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Proyecto/Edificio:</Text>
            <Text style={styles.metaValue}>{consorcioNombre}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Administración:</Text>
            <Text style={styles.metaValue}>{adminNombre}</Text>
          </View>
        </View>

        <Text style={styles.title}>{instructivo.titulo}</Text>

        <View style={{ marginTop: 10 }}>
          {(instructivo.contenido || []).map((bloque, i) => {
            if (bloque.tipo === 'titulo') {
              return <Text key={i} style={styles.blockTitle}>{bloque.contenido}</Text>;
            }
            if (bloque.tipo === 'imagen') {
              return (
                <View key={i} style={{ marginVertical: 10 }}>
                  <Text style={styles.blockImageNote}>[Imagen adjunta: {bloque.contenido}]</Text>
                </View>
              );
            }
            return <Text key={i} style={styles.blockText}>{bloque.contenido}</Text>;
          })}
        </View>

        <View style={styles.footer} fixed>
          <Text>SafeLink — Guía Técnica para Clientes</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
