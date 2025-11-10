import React, { useState } from "react";

// Tabs Component
export const Tabs = ({
  children,
  defaultTab = 0,
  variant = "default", // 'default', 'pills', 'underline'
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Extract tab buttons and content from children
  const tabs = React.Children.toArray(children).filter(
    (child) => child.type === Tab
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div
        className={`flex ${variant === "underline" ? "border-b" : "gap-2"}`}
        style={
          variant === "underline"
            ? { borderColor: "hsl(var(--color-border))" }
            : {}
        }
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;

          // Variant styles
          let tabClasses =
            "px-4 py-2 font-medium transition-all duration-200 cursor-pointer";
          let activeStyles = {};
          let inactiveStyles = {};

          if (variant === "pills") {
            tabClasses += " rounded-lg";
            if (isActive) {
              activeStyles = {
                backgroundColor: "hsl(var(--color-primary))",
                color: "white",
              };
            } else {
              inactiveStyles = {
                backgroundColor: "hsl(var(--color-surface))",
                color: "hsl(var(--color-muted))",
              };
            }
          } else if (variant === "underline") {
            tabClasses += " border-b-2 -mb-px";
            if (isActive) {
              activeStyles = {
                borderColor: "hsl(var(--color-primary))",
                color: "hsl(var(--color-primary))",
              };
            } else {
              inactiveStyles = {
                borderColor: "transparent",
                color: "hsl(var(--color-muted))",
              };
            }
          } else {
            // default
            tabClasses += " rounded-t-lg border-b-2";
            if (isActive) {
              activeStyles = {
                backgroundColor: "hsl(var(--color-surface))",
                borderColor: "hsl(var(--color-primary))",
                color: "hsl(var(--color-primary))",
              };
            } else {
              inactiveStyles = {
                backgroundColor: "transparent",
                borderColor: "transparent",
                color: "hsl(var(--color-muted))",
              };
            }
          }

          return (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={tabClasses}
              style={isActive ? activeStyles : inactiveStyles}
            >
              {tab.props.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className='mt-4'>{tabs[activeTab]}</div>
    </div>
  );
};

// Individual Tab Component
export const Tab = ({ children, label }) => {
  return <div>{children}</div>;
};

// Demo Component
export default function TabsDemo() {
  return (
    <div className='p-8 space-y-12 max-w-4xl mx-auto'>
      <h1
        className='text-3xl font-bold mb-6'
        style={{ color: "hsl(var(--color-heading))" }}
      >
        Tabs Component Demo
      </h1>

      {/* Default Variant */}
      <section>
        <h2
          className='text-xl font-semibold mb-4'
          style={{ color: "hsl(var(--color-primary))" }}
        >
          Default Tabs
        </h2>
        <Tabs defaultTab={0} variant='default'>
          <Tab label='Profile'>
            <div
              className='p-6 rounded-lg'
              style={{
                backgroundColor: "hsl(var(--color-surface))",
                border: "1px solid hsl(var(--color-border))",
              }}
            >
              <h3 className='text-lg font-semibold mb-3'>
                Profile Information
              </h3>
              <p style={{ color: "hsl(var(--color-muted))" }}>
                This is the profile tab content. You can add forms, user
                information, or any other content here.
              </p>
              <div className='mt-4 space-y-2'>
                <div className='flex justify-between'>
                  <span className='font-medium'>Name:</span>
                  <span style={{ color: "hsl(var(--color-muted))" }}>
                    John Doe
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='font-medium'>Email:</span>
                  <span style={{ color: "hsl(var(--color-muted))" }}>
                    john@example.com
                  </span>
                </div>
              </div>
            </div>
          </Tab>
          <Tab label='Settings'>
            <div
              className='p-6 rounded-lg'
              style={{
                backgroundColor: "hsl(var(--color-surface))",
                border: "1px solid hsl(var(--color-border))",
              }}
            >
              <h3 className='text-lg font-semibold mb-3'>Settings</h3>
              <p style={{ color: "hsl(var(--color-muted))" }}>
                Configure your preferences and account settings here.
              </p>
              <div className='mt-4 space-y-3'>
                <label className='flex items-center gap-2'>
                  <input type='checkbox' className='w-4 h-4' />
                  <span>Enable notifications</span>
                </label>
                <label className='flex items-center gap-2'>
                  <input type='checkbox' className='w-4 h-4' />
                  <span>Dark mode</span>
                </label>
              </div>
            </div>
          </Tab>
          <Tab label='Activity'>
            <div
              className='p-6 rounded-lg'
              style={{
                backgroundColor: "hsl(var(--color-surface))",
                border: "1px solid hsl(var(--color-border))",
              }}
            >
              <h3 className='text-lg font-semibold mb-3'>Recent Activity</h3>
              <div className='space-y-3'>
                <div
                  className='p-3 rounded'
                  style={{ backgroundColor: "hsl(var(--color-background))" }}
                >
                  <p className='font-medium'>Logged in</p>
                  <p
                    className='text-sm'
                    style={{ color: "hsl(var(--color-muted))" }}
                  >
                    2 hours ago
                  </p>
                </div>
                <div
                  className='p-3 rounded'
                  style={{ backgroundColor: "hsl(var(--color-background))" }}
                >
                  <p className='font-medium'>Updated profile</p>
                  <p
                    className='text-sm'
                    style={{ color: "hsl(var(--color-muted))" }}
                  >
                    1 day ago
                  </p>
                </div>
              </div>
            </div>
          </Tab>
        </Tabs>
      </section>

      {/* Pills Variant */}
      <section>
        <h2
          className='text-xl font-semibold mb-4'
          style={{ color: "hsl(var(--color-primary))" }}
        >
          Pills Tabs
        </h2>
        <Tabs defaultTab={0} variant='pills'>
          <Tab label='Overview'>
            <div
              className='p-6 rounded-lg'
              style={{
                backgroundColor: "hsl(var(--color-surface))",
                border: "1px solid hsl(var(--color-border))",
              }}
            >
              <h3 className='text-lg font-semibold mb-3'>Overview</h3>
              <p style={{ color: "hsl(var(--color-muted))" }}>
                This tab uses the pills variant with a filled background for the
                active tab.
              </p>
            </div>
          </Tab>
          <Tab label='Analytics'>
            <div
              className='p-6 rounded-lg'
              style={{
                backgroundColor: "hsl(var(--color-surface))",
                border: "1px solid hsl(var(--color-border))",
              }}
            >
              <h3 className='text-lg font-semibold mb-3'>Analytics</h3>
              <div className='grid grid-cols-3 gap-4 mt-4'>
                <div
                  className='p-4 rounded text-center'
                  style={{ backgroundColor: "hsl(var(--color-primary) / 0.1)" }}
                >
                  <p
                    className='text-2xl font-bold'
                    style={{ color: "hsl(var(--color-primary))" }}
                  >
                    1,234
                  </p>
                  <p
                    className='text-sm'
                    style={{ color: "hsl(var(--color-muted))" }}
                  >
                    Views
                  </p>
                </div>
                <div
                  className='p-4 rounded text-center'
                  style={{ backgroundColor: "hsl(var(--color-success) / 0.1)" }}
                >
                  <p
                    className='text-2xl font-bold'
                    style={{ color: "hsl(var(--color-success))" }}
                  >
                    567
                  </p>
                  <p
                    className='text-sm'
                    style={{ color: "hsl(var(--color-muted))" }}
                  >
                    Users
                  </p>
                </div>
                <div
                  className='p-4 rounded text-center'
                  style={{ backgroundColor: "hsl(var(--color-accent) / 0.1)" }}
                >
                  <p
                    className='text-2xl font-bold'
                    style={{ color: "hsl(var(--color-accent))" }}
                  >
                    89
                  </p>
                  <p
                    className='text-sm'
                    style={{ color: "hsl(var(--color-muted))" }}
                  >
                    Sales
                  </p>
                </div>
              </div>
            </div>
          </Tab>
          <Tab label='Reports'>
            <div
              className='p-6 rounded-lg'
              style={{
                backgroundColor: "hsl(var(--color-surface))",
                border: "1px solid hsl(var(--color-border))",
              }}
            >
              <h3 className='text-lg font-semibold mb-3'>Reports</h3>
              <p style={{ color: "hsl(var(--color-muted))" }}>
                Generate and view your reports here.
              </p>
            </div>
          </Tab>
        </Tabs>
      </section>

      {/* Underline Variant */}
      <section>
        <h2
          className='text-xl font-semibold mb-4'
          style={{ color: "hsl(var(--color-primary))" }}
        >
          Underline Tabs
        </h2>
        <Tabs defaultTab={1} variant='underline'>
          <Tab label='Dashboard'>
            <div
              className='p-6 rounded-lg'
              style={{
                backgroundColor: "hsl(var(--color-surface))",
                border: "1px solid hsl(var(--color-border))",
              }}
            >
              <h3 className='text-lg font-semibold mb-3'>Dashboard</h3>
              <p style={{ color: "hsl(var(--color-muted))" }}>
                Your dashboard overview with key metrics and information.
              </p>
            </div>
          </Tab>
          <Tab label='Projects'>
            <div
              className='p-6 rounded-lg'
              style={{
                backgroundColor: "hsl(var(--color-surface))",
                border: "1px solid hsl(var(--color-border))",
              }}
            >
              <h3 className='text-lg font-semibold mb-3'>Projects</h3>
              <div className='space-y-3 mt-4'>
                {["Website Redesign", "Mobile App", "API Integration"].map(
                  (project, i) => (
                    <div
                      key={i}
                      className='p-4 rounded flex justify-between items-center'
                      style={{
                        backgroundColor: "hsl(var(--color-background))",
                      }}
                    >
                      <div>
                        <p className='font-medium'>{project}</p>
                        <p
                          className='text-sm'
                          style={{ color: "hsl(var(--color-muted))" }}
                        >
                          In Progress
                        </p>
                      </div>
                      <div
                        className='px-3 py-1 rounded text-sm'
                        style={{
                          backgroundColor: "hsl(var(--color-success))",
                          color: "white",
                        }}
                      >
                        Active
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </Tab>
          <Tab label='Team'>
            <div
              className='p-6 rounded-lg'
              style={{
                backgroundColor: "hsl(var(--color-surface))",
                border: "1px solid hsl(var(--color-border))",
              }}
            >
              <h3 className='text-lg font-semibold mb-3'>Team Members</h3>
              <p style={{ color: "hsl(var(--color-muted))" }}>
                Manage your team and collaborate effectively.
              </p>
            </div>
          </Tab>
        </Tabs>
      </section>
    </div>
  );
}
