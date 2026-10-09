import React from 'react';
import { Phone, CheckCircle, Trash2, Mail, Edit3 } from 'lucide-react';

export const TrustedContactCard = ({ contact, onEdit, onDelete }) => {
  if (!contact) return null;

  const contactName = contact.name || 'Emergency Contact';
  const initial = contactName.charAt(0).toUpperCase();

  return (
    <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white border-2 border-[#FFCCE1] hover:border-[#FF5C8A] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-[0_6px_20px_rgba(255,92,138,0.12)] hover:shadow-[0_10px_28px_rgba(255,42,109,0.22)] transition-all duration-300 min-w-0 overflow-hidden">
      <div className="flex items-center space-x-3 sm:space-x-3.5 min-w-0 flex-1">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center font-black text-sm sm:text-base border-2 border-white shadow-md shrink-0">
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-1.5 min-w-0">
            <h4 className="font-black text-[#2A0826] text-xs sm:text-sm truncate">{contactName}</h4>
            {contact.isVerified && (
              <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50 shrink-0" />
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-[#684E67] font-bold truncate">
            {contact.relationship || 'Guardian'} • {contact.phone || 'No Phone'}
          </p>
          {contact.email && (
            <p className="text-[10px] sm:text-[11px] text-[#FF2A6D] font-extrabold flex items-center mt-0.5 truncate">
              <Mail className="w-3 h-3 mr-1 text-[#FF2A6D] shrink-0" />
              <span className="truncate">{contact.email}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-[#FF5C8A] to-[#FF2A6D] text-white hover:scale-110 shadow-sm transition-all flex items-center justify-center shrink-0"
            title="Call Contact"
            aria-label={`Call ${contactName}`}
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
        )}

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(contact)}
            className="p-2 sm:p-2.5 rounded-xl text-[#684E67] hover:text-[#FF2A6D] hover:bg-[#FFF0F3] transition-colors cursor-pointer shrink-0"
            title="Edit Contact"
            aria-label={`Edit ${contactName}`}
          >
            <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(contact.id)}
            className="p-2 sm:p-2.5 rounded-xl text-[#684E67] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            title="Remove Contact"
            aria-label={`Remove ${contactName}`}
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
