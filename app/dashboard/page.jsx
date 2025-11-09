// app/dashboard/page.js - Public landing page with progressive enhancement
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import Link from "next/link";
import { CardTitle } from "@/components/ui/card/CardTitle";
import { CardHeader } from "@/components/ui/card/CardHeader";
import { CardGrid } from "@/components/ui/card/CardGrid";
import { Card } from "@/components/ui/card/Card";
import { CardDescription } from "@/components/ui/card/CardDescription";
import { CardList } from "@/components/ui/card/CardList";
import { CardContent, CardFooter } from "@/components/ui/card/CardContent";

export default async function Dashboard() {
  // Check if user is logged in (optional on this page)
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  let user = null;
  if (token) {
    try {
      user = await verifyToken(token);
    } catch (error) {
      // Token invalid, treat as not logged in
      user = null;
    }
  }

  // Example Usage Component
  return (
    <div className='space-y-8 p-6'>
      {/* Grid Example */}
      <div>
        <h2 className='text-2xl font-bold mb-4'>Grid Layout</h2>
        <CardGrid cols={3} gap='md'>
          <Card variant='clickable'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>👤</span>
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage user accounts</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card variant='hover' shadow>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>⚽</span>
                <div>
                  <CardTitle>Teams</CardTitle>
                  <CardDescription>Configure teams</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card variant='outlined'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>📊</span>
                <div>
                  <CardTitle>Stats</CardTitle>
                  <CardDescription>View statistics</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </CardGrid>
      </div>

      {/* List Example */}
      <div>
        <h2 className='text-2xl font-bold mb-4'>List Layout</h2>
        <CardList gap='sm'>
          <Card variant='clickable' padding='md'>
            <div className='flex items-center gap-4'>
              <span className='text-3xl'>👤</span>
              <div className='flex-1'>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </div>
            </div>
          </Card>

          <Card variant='clickable' padding='md'>
            <div className='flex items-center gap-4'>
              <span className='text-3xl'>⚽</span>
              <div className='flex-1'>
                <CardTitle>Teams</CardTitle>
                <CardDescription>Configure teams and rosters</CardDescription>
              </div>
            </div>
          </Card>
        </CardList>
      </div>

      {/* Complex Card Example */}
      <div>
        <h2 className='text-2xl font-bold mb-4'>Complex Card</h2>
        <CardGrid cols={2} gap='lg'>
          <Card variant='hover' shadow padding='lg'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>Analytics</CardTitle>
                <span className='text-2xl'>📈</span>
              </div>
              <CardDescription>Track your performance metrics</CardDescription>
            </CardHeader>

            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm text-muted'>Total Users</span>
                  <span className='font-semibold'>1,234</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-muted'>Active Teams</span>
                  <span className='font-semibold'>56</span>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <button className='w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition'>
                View Details
              </button>
            </CardFooter>
          </Card>
        </CardGrid>
      </div>
    </div>
  );
}
