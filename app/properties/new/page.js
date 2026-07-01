import PropertyForm from '../../../components/PropertyForm'
import ProtectedRoute from '../../../components/ProtectedRoute'

export default function NewPropertyPage() {
  return (
    <ProtectedRoute allowedRoles={['landlord']}>
      <div className="px-4 py-6 lg:px-8">
        <PropertyForm />
      </div>
    </ProtectedRoute>
  )
}
