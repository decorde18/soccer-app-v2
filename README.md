<div className="space-y-4 p-6 max-w-md mx-auto">
  <Input label="Username" placeholder="Enter your username" />
  <Input label="Email" type="email" size="lg" />
  <Textarea label="Comments" rows={5} />
  <Select
    label="Role"
    options={[
      { label: "Player", value: "player" },
      { label: "Coach", value: "coach" },
      { label: "Parent", value: "parent" },
    ]}
  />
  <Checkbox label="Subscribe to updates" />
  <Toggle label="Dark Mode" checked={isDark} onChange={toggleTheme} />
  <Button variant="primary">Save</Button>
  <Button variant="outline">Cancel</Button>
</div>

ADD YOUR DETAILS HERE
echo "# soccer-app-v2" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/decorde18/soccer-app-v2.git
git push -u origin main

//TODO GameMenuPage
