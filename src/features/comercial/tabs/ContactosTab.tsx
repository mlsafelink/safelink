import { useState, useMemo } from 'react';
import {
  Users, Search, Plus, Phone, Mail, Building2,
  Clock, Edit, Trash2
} from 'lucide-react';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { type CommercialContact, type CommercialCompany } from '@/services/commercialService';

interface ContactosTabProps {
  contacts: CommercialContact[];
  companies: CommercialCompany[];
  onOpenNewContact: () => void;
  onEditContact: (contact: CommercialContact) => void;
  onDeleteContact: (contactId: string) => void;
  onSelectCompany: (company: CommercialCompany) => void;
}

export function ContactosTab({
  contacts,
  companies,
  onOpenNewContact,
  onEditContact,
  onDeleteContact,
  onSelectCompany
}: ContactosTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Map rápido de empresas por ID
  const companyMap = useMemo(() => {
    const map = new Map<string, CommercialCompany>();
    companies.forEach(c => map.set(c.id, c));
    return map;
  }, [companies]);

  // Filtrado reactivo
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      if (filterEstado && c.estado_verificacion !== filterEstado) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const fullName = `${c.nombre} ${c.apellido || ''}`.toLowerCase();
        const cargo = (c.cargo || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const tel = (c.telefono || '').toLowerCase();
        const comp = companyMap.get(c.company_id)?.nombre_comercial.toLowerCase() || '';

        if (!fullName.includes(term) && !cargo.includes(term) && !email.includes(term) && !tel.includes(term) && !comp.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [contacts, searchTerm, filterEstado, companyMap]);

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
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px', maxWidth: '380px' }}>
          <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, cargo, empresa o teléfono..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            style={{
              padding: '0.5rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          >
            <option value="">Todos los Estados de Verificación</option>
            <option value="Confirmado">Confirmado</option>
            <option value="A confirmar">A confirmar</option>
            <option value="Desactualizado">Desactualizado</option>
            <option value="Desvinculado">Desvinculado</option>
          </select>

          <Button size="sm" variant="primary" leftIcon={<Plus size={14} />} onClick={onOpenNewContact}>
            Nuevo Contacto
          </Button>
        </div>
      </div>

      {/* Grid de Contactos */}
      {filteredContacts.length === 0 ? (
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
          <Users size={40} color="var(--text-secondary)" style={{ marginBottom: '0.75rem' }} />
          <h3>No se encontraron contactos</h3>
          <p style={{ margin: '0.2rem 0 1rem 0', fontSize: '0.85rem' }}>
            {searchTerm || filterEstado
              ? 'Prueba cambiando los términos de búsqueda o filtros.'
              : 'Empieza registrando los contactos clave de tus empresas prospectadas.'}
          </p>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={onOpenNewContact}>
            Registrar Contacto
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
          {filteredContacts.map(contact => {
            const company = companyMap.get(contact.company_id);
            return (
              <Card
                key={contact.id}
                variant="glass"
                style={{
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {contact.nombre} {contact.apellido || ''}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {contact.cargo || 'Sin cargo especificado'} {contact.area ? `• ${contact.area}` : ''}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: contact.estado_verificacion === 'Confirmado' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: contact.estado_verificacion === 'Confirmado' ? '#10b981' : '#f59e0b'
                      }}
                    >
                      {contact.estado_verificacion}
                    </span>
                  </div>

                  {/* Empresa vinculada */}
                  {company && (
                    <div
                      onClick={() => onSelectCompany(company)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--primary-color)',
                        cursor: 'pointer',
                        marginTop: '0.5rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(139, 92, 246, 0.08)'
                      }}
                    >
                      <Building2 size={12} /> {company.nombre_comercial}
                    </div>
                  )}

                  {/* Vías de contacto */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.75rem', fontSize: '0.82rem' }}>
                    {contact.telefono && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={13} color="var(--text-secondary)" />
                        <a href={`tel:${contact.telefono}`} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                          {contact.telefono}
                        </a>
                        <a
                          href={`https://wa.me/${contact.telefono.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: '#25D366',
                            color: '#ffffff',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            textDecoration: 'none'
                          }}
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}

                    {contact.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Mail size={13} color="var(--text-secondary)" />
                        <a href={`mailto:${contact.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {contact.email}
                        </a>
                      </div>
                    )}

                    {contact.horario_contacto && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        <Clock size={12} /> {contact.horario_contacto}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    paddingTop: '0.6rem',
                    borderTop: '1px solid var(--glass-border)'
                  }}
                >
                  <button
                    onClick={() => onEditContact(contact)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '0.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.8rem'
                    }}
                    title="Editar contacto"
                  >
                    <Edit size={14} /> Editar
                  </button>
                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '0.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.8rem'
                    }}
                    title="Eliminar contacto"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
