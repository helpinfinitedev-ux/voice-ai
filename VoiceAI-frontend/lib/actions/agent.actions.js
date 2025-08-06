'use server';

import { handleError } from '@/lib/utils';
import Agent from '../database/models/agent.model';
import { connectToDatabase } from '../database';

export async function createAgent(agentBody) {
  try {
    await connectToDatabase();

    const { userId, name, prompt, tone, phone, scheduleCall } = agentBody;
    const agent = await Agent.create({
      userId,
      name,
      prompt,
      tone,
      phone,
      scheduleCall,
    });
    return JSON.parse(JSON.stringify(agent));
  } catch (error) {
    console.log(error);
  }
}

export async function updateAgent(agentId, updatedData) {
  try {
    await connectToDatabase();

    const updatedAgent = await Agent.findByIdAndUpdate(agentId, updatedData, {
      new: true,
    });

    return JSON.parse(JSON.stringify(updatedAgent));
  } catch (error) {
    handleError(error);
  }
}

export async function deleteAgent(agentId) {
  try {
    await connectToDatabase();

    const deletedAgent = await Agent.findByIdAndDelete(agentId);
    if (!deletedAgent) {
      return null;
    }
    return JSON.parse(JSON.stringify(deleteAgent));
  } catch (error) {
    console.log(error);
  }
}

export async function getAllAgents(userId) {
  try {
    await connectToDatabase();

    const agents = await Agent.find({ userId });
    return JSON.parse(JSON.stringify(agents));
  } catch (error) {
    handleError(error);
  }
}
export async function getAgentById(id) {
  try {
    await connectToDatabase();
    const agent = await Agent.findById(id);
    return JSON.parse(JSON.stringify(agent));
  } catch (err) {
    console.log(err);
  }
}
