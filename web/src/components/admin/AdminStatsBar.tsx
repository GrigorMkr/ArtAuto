import { memo } from "react";
import type { AdminStats } from "../../lib/adminApi";

type Props = { stats: AdminStats };

export const AdminStatsBar = memo(function AdminStatsBar({ stats }: Props) {
  return (
    <div className="admin-stats">
      <div>
        <strong>{stats.total}</strong>
        <span>всего</span>
      </div>
      <div>
        <strong>{stats.korea}</strong>
        <span>Корея</span>
      </div>
      <div>
        <strong>{stats.china}</strong>
        <span>Китай</span>
      </div>
      <div>
        <strong>
          {stats.chinaPhotosCached}/{stats.china}
        </strong>
        <span>фото CN в кэше</span>
      </div>
      <div>
        <strong>{stats.leads}</strong>
        <span>заявки</span>
      </div>
    </div>
  );
});
