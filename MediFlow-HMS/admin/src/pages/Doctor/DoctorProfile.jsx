import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import LoadingState from '../../components/backoffice/LoadingState';
import PageHeader from '../../components/backoffice/PageHeader';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';

const DoctorProfile = () => {
  const { dToken, profileData, setProfileData, getProfileData } = useContext(DoctorContext);
  const { currency, backendUrl } = useContext(AppContext);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (dToken) {
      getProfileData();
    }
  }, [dToken, getProfileData]);

  const updateProfile = async () => {
    try {
      const updateData = {
        address: profileData.address,
        fees: profileData.fees,
        about: profileData.about,
        available: profileData.available,
      };

      const { data } = await axios.post(`${backendUrl}/api/doctor/update-profile`, updateData, {
        headers: { dToken },
      });

      if (data.success) {
        toast.success(data.message);
        setIsEdit(false);
        getProfileData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!profileData) {
    return <LoadingState label="Loading doctor profile..." />;
  }

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Doctor profile"
        title="Keep your public profile accurate so patients know what to expect."
        description="Fees, bio, and consultation details should be simple to review and update without digging through settings."
        actions={
          isEdit ? (
            <>
              <button type="button" className="soft-button-secondary" onClick={() => setIsEdit(false)}>
                Cancel
              </button>
              <button type="button" className="soft-button-primary" onClick={updateProfile}>
                Save changes
              </button>
            </>
          ) : (
            <button type="button" className="soft-button-accent" onClick={() => setIsEdit(true)}>
              Edit profile
            </button>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <SurfaceCard className="space-y-4">
          <img src={profileData.image} alt="" className="h-[280px] w-full rounded-[28px] object-cover" />
          <div className="flex flex-wrap items-center gap-2">
            {profileData.available ? <StatusBadge tone="success">Available</StatusBadge> : <StatusBadge tone="danger">Unavailable</StatusBadge>}
            <StatusBadge tone="info">{profileData.experience}</StatusBadge>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{profileData.name}</p>
            <p className="mt-1 text-sm text-slate-500">{profileData.degree} • {profileData.speciality}</p>
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Consultation fee</label>
              {isEdit ? (
                <input
                  type="number"
                  className="soft-input"
                  value={profileData.fees}
                  onChange={(event) => setProfileData((prev) => ({ ...prev, fees: event.target.value }))}
                />
              ) : (
                <div className="soft-input flex items-center">{currency} {profileData.fees}</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Availability</label>
              <div className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{profileData.available ? 'Available for booking' : 'Hidden from booking'}</p>
                  <p className="text-xs text-slate-500">Toggle whether patients can book right now.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={profileData.available}
                    onChange={() => isEdit && setProfileData((prev) => ({ ...prev, available: !prev.available }))}
                  />
                  <span className="h-7 w-14 rounded-full bg-slate-200 transition after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-teal-500 peer-checked:after:translate-x-7" />
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Address line 1</label>
              {isEdit ? (
                <input
                  className="soft-input"
                  value={profileData.address.line1}
                  onChange={(event) => setProfileData((prev) => ({ ...prev, address: { ...prev.address, line1: event.target.value } }))}
                />
              ) : (
                <div className="soft-input flex items-center">{profileData.address.line1}</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Address line 2</label>
              {isEdit ? (
                <input
                  className="soft-input"
                  value={profileData.address.line2}
                  onChange={(event) => setProfileData((prev) => ({ ...prev, address: { ...prev.address, line2: event.target.value } }))}
                />
              ) : (
                <div className="soft-input flex items-center">{profileData.address.line2}</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">About</label>
            {isEdit ? (
              <textarea
                rows={8}
                className="soft-textarea"
                value={profileData.about}
                onChange={(event) => setProfileData((prev) => ({ ...prev, about: event.target.value }))}
              />
            ) : (
              <div className="rounded-[24px] border border-slate-200 bg-white/80 px-5 py-4 text-sm leading-7 text-slate-600">
                {profileData.about}
              </div>
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
};

export default DoctorProfile;
