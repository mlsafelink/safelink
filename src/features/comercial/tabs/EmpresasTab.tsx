import { useState, useMemo } from 'react';
import {
  Building2, Search, Plus, UploadCloud, MapPin,
  Phone, Users, ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { type CommercialCompany, type CommercialContact } from '@/services/commercialService';

interface EmpresasTabProps {
  companies: CommercialCompany[];
  contacts: CommercialContact[];
  onSelectCompany: (company: CommercialCompany) => void;
  onOpenNewCompany: () => void;
  onOpenImportExcel: () => void;
  onDeleteCompany?: (companyId: string) => void;
}

export function EmpresasTab({
  companies,
  contacts,
  onSelectCompany,
  onOpenNewCompany,
  onOpenImportExcel
}: EmpresasTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRubro, setFilterRubro] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Contactos por empresa para mostrar conteo
  const contactsByCompany = useMemo(() => {
    const map = new Map<string, number>();
    contacts.forEach(c => {
      map.set(c.company_id, (map.get(c.company_id) || 0) + 1);
    });
    return map;
  }, [contacts]);

  // Lista única de rubros y estados para los filtros
  const rubrosList = useMemo(() => {
    const set = new Set<string>();
    companies.forEach(c => { if (c.rubro) set.add(c.rubro); });
    return Array.from(set);
  }, [companies]);

  const estadosList = useMemo(() => {
    const set = new Set<string>();
    companies.forEach(c => { if (c.estado_investigacion) set.add(c.estado_investigacion); });
    return Array.from(set);
  }, [companies]);

  // Filtrado reactivo
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      if (filterRubro && c.rubro !== filterRubro) return false;
      if (filterPrioridad && c.prioridad !== filterPrioridad) return false;
      if (filterEstado && c.estado_investigacion !== filterEstado) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = c.nombre_comercial.toLowerCase().includes(term);
        const matchSocial = c.razon_social?.toLowerCase().includes(term);
        const matchAddress = c.direccion?.toLowerCase().includes(term);
        const matchLoc = c.localidad?.toLowerCase().includes(term);
        if (!matchName && !matchSocial && !matchAddress && !matchLoc) return false;
      }
      return true;
    });
  }, [companies, searchTerm, filterRubro, filterPrioridad, filterEstado]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Barra de Filtros y Búsqueda */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'var(--glass-bg)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--glass-border)'
        }}
      >
        {/* Búsqueda rápida */}
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px', maxWidth: '380px' }}>
          <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, dirección o localidad..."
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filtros select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {rubrosList.length > 0 && (
            <select
              value={filterRubro}
              onChange={e => setFilterRubro(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="">Todos los Rubros</option>
              {rubrosList.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}

          <select
            value={filterPrioridad}
            onChange={e => setFilterPrioridad(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="">Todas las Prioridades</option>
            <option value="Alta">Prioridad Alta</option>
            <option value="Media">Prioridad Media</option>
            <option value="Baja">Prioridad Baja</option>
          </select>

          {estadosList.length > 0 && (
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="">Todos los Estados</option>
              {estadosList.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          )}
        </div>

        {/* Acciones principales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button size="sm" variant="secondary" leftIcon={<UploadCloud size={14} />} onClick={onOpenImportExcel}>
            Importar Excel
          </Button>
          <Button size="sm" variant="primary" leftIcon={<Plus size={14} />} onClick={onOpenNewCompany}>
            Nueva Empresa
          </Button>
        </div>
      </div>

      {/* Listado / Grid de Empresas */}
      {filteredCompanies.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            background: 'var(--glass-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)'
          }}
        >
          <Building2 size={40} color="var(--text-secondary)" style={{ marginBottom: '0.75rem' }} />
          <h3>No se encontraron empresas</h3>
          <p style={{ margin: '0.2rem 0 1rem 0', fontSize: '0.85rem' }}>
            {searchTerm || filterRubro || filterPrioridad || filterEstado
              ? 'Prueba modificando los filtros o el término de búsqueda.'
              : 'Aún no tienes empresas prospectadas en el directorio.'}
          </p>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={onOpenNewCompany}>
            Crear Empresa
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filteredCompanies.map(comp => {
            const contactCount = contactsByCompany.get(comp.id) || 0;
            return (
              <Card
                key={comp.id}
                variant="glass"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  border: '1px solid var(--glass-border)'
                }}
                onClick={() => onSelectCompany(comp)}
              >
                <div>
                  {/* Fila superior: Nombre comercial y badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {comp.nombre_comercial}
                      </h3>
                      {comp.razon_social && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {comp.razon_social}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: comp.prioridad === 'Alta' ? 'rgba(239, 68, 68, 0.15)' : comp.prioridad === 'Media' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        color: comp.prioridad === 'Alta' ? '#ef4444' : comp.prioridad === 'Media' ? '#f59e0b' : '#64748b'
                      }}
                    >
                      {comp.prioridad}
                    </span>
                  </div>

                  {/* Rubro y Estado */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', margin: '0.6rem 0' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(139, 92, 246, 0.12)',
                        color: 'var(--primary-color)'
                      }}
                    >
                      {comp.estado_investigacion}
                    </span>
                    {comp.rubro && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        • {comp.rubro}
                      </span>
                    )}
                  </div>

                  {/* Dirección y Teléfono */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {comp.direccion && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={13} />
                        <span>{comp.direccion}{comp.localidad ? `, ${comp.localidad}` : ''}</span>
                      </div>
                    )}
                    {comp.telefono && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={13} />
                        <span>{comp.telefono}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer de la tarjeta */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--glass-border)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={13} /> {contactCount} {contactCount === 1 ? 'contacto' : 'contactos'}
                  </span>

                  <span style={{ color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    Ver ficha <ArrowUpRight size={13} />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

const filterSelectStyle: React.CSSProperties = {
  padding: '0.5rem 0.65rem',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
  outline: 'none',
  boxSizing: 'border-box'
};
